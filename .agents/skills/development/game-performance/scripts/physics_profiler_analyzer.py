#!/usr/bin/env python3
"""Scan Unity C# scripts for physics API misuse patterns."""
import argparse
import re
import sys
from pathlib import Path


PATTERNS = [
    {
        "id": "transform-position-direct-set",
        "severity": "HIGH",
        "regex": re.compile(r"transform\.position\s*="),
        "message": "Directly setting transform.position on a Rigidbody bypasses the physics engine.",
        "fix": "Use Rigidbody.MovePosition() inside FixedUpdate() to avoid interpolation stutter.",
        "context": "any",
    },
    {
        "id": "physics-raycast-allocating",
        "severity": "MED",
        "regex": re.compile(r"Physics\.Raycast\s*\("),
        "message": "Physics.Raycast() with RaycastHit out-param allocates per call in some Unity versions.",
        "fix": "Switch to Physics.RaycastNonAlloc() and reuse a pre-allocated RaycastHit[].",
        "context": "any",
    },
    {
        "id": "get-component-rigidbody-update",
        "severity": "HIGH",
        "regex": re.compile(r"GetComponent\s*<\s*Rigidbody\s*>"),
        "message": "GetComponent<Rigidbody>() inside Update/FixedUpdate is slow.",
        "fix": "Cache the Rigidbody reference in Awake() or Start().",
        "context": "hot",
    },
    {
        "id": "add-force-outside-fixed-update",
        "severity": "HIGH",
        "regex": re.compile(r"\.AddForce\s*\("),
        "message": "AddForce() called outside FixedUpdate() causes non-deterministic physics.",
        "fix": "Move all AddForce() / AddTorque() calls into FixedUpdate().",
        "context": "non-fixed",
    },
    {
        "id": "physics-overlap-allocating",
        "severity": "MED",
        "regex": re.compile(r"Physics\.Overlap(?:Sphere|Box|Capsule)\s*\("),
        "message": "Physics.Overlap*() allocates a new Collider[] per call.",
        "fix": "Use Physics.Overlap*NonAlloc() with a pre-allocated array.",
        "context": "any",
    },
    {
        "id": "transform-rotation-direct-set",
        "severity": "MED",
        "regex": re.compile(r"transform\.rotation\s*="),
        "message": "Directly setting transform.rotation on a Rigidbody bypasses physics rotation interpolation.",
        "fix": "Use Rigidbody.MoveRotation() inside FixedUpdate().",
        "context": "any",
    },
]

HOT_METHODS = {"Update", "LateUpdate", "OnGUI", "OnCollisionEnter", "OnTriggerEnter"}
FIXED_METHODS = {"FixedUpdate"}


def extract_methods(content: str) -> dict[str, list[tuple[int, str]]]:
    """Return dict of method_name → [(line_no, line_text)]."""
    result: dict[str, list[tuple[int, str]]] = {}
    method_re = re.compile(
        r"\b(?:private|public|protected|internal|virtual|override|static)?\s*"
        r"(?:void|IEnumerator|bool|int|float)\s+(\w+)\s*\([^)]*\)\s*\{",
        re.MULTILINE,
    )
    for m in method_re.finditer(content):
        name = m.group(1)
        start_brace = m.end() - 1
        pos = start_brace + 1
        depth = 1
        while pos < len(content) and depth > 0:
            if content[pos] == "{":
                depth += 1
            elif content[pos] == "}":
                depth -= 1
            pos += 1
        body = content[start_brace:pos]
        start_line = content[:m.start()].count("\n") + 1
        body_lines = [(start_line + i, line) for i, line in enumerate(body.splitlines())]
        result[name] = body_lines
    return result


def scan_file(file_path: Path) -> list[dict]:
    findings = []
    try:
        content = file_path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return findings

    methods = extract_methods(content)

    for pattern in PATTERNS:
        ctx = pattern["context"]

        if ctx == "any":
            # Scan entire file, report line
            for line_no, line in enumerate(content.splitlines(), 1):
                stripped = line.strip()
                if stripped.startswith("//"):
                    continue
                if pattern["regex"].search(stripped):
                    findings.append({
                        "file": str(file_path),
                        "line": line_no,
                        "method": "<global>",
                        "severity": pattern["severity"],
                        "id": pattern["id"],
                        "message": pattern["message"],
                        "fix": pattern["fix"],
                        "snippet": stripped[:120],
                    })

        elif ctx == "hot":
            for method_name, lines in methods.items():
                if method_name not in HOT_METHODS:
                    continue
                for line_no, line_text in lines:
                    stripped = line_text.strip()
                    if stripped.startswith("//"):
                        continue
                    if pattern["regex"].search(stripped):
                        findings.append({
                            "file": str(file_path),
                            "line": line_no,
                            "method": method_name,
                            "severity": pattern["severity"],
                            "id": pattern["id"],
                            "message": pattern["message"],
                            "fix": pattern["fix"],
                            "snippet": stripped[:120],
                        })

        elif ctx == "non-fixed":
            for method_name, lines in methods.items():
                if method_name in FIXED_METHODS:
                    continue
                for line_no, line_text in lines:
                    stripped = line_text.strip()
                    if stripped.startswith("//"):
                        continue
                    if pattern["regex"].search(stripped):
                        findings.append({
                            "file": str(file_path),
                            "line": line_no,
                            "method": method_name,
                            "severity": pattern["severity"],
                            "id": pattern["id"],
                            "message": pattern["message"],
                            "fix": pattern["fix"],
                            "snippet": stripped[:120],
                        })

    return findings


def main():
    parser = argparse.ArgumentParser(
        description="Scan Unity C# scripts for physics API misuse."
    )
    parser.add_argument("target", nargs="?", default="Assets",
                        help="Directory or .cs file to scan (default: Assets)")
    parser.add_argument("--severity", choices=["HIGH", "MED", "ALL"], default="ALL")
    args = parser.parse_args()

    root = Path(args.target)
    if not root.exists():
        raise SystemExit(f"Target does not exist: {root}")

    files = list(root.rglob("*.cs")) if root.is_dir() else [root]
    print("⚙️  Physics Profiler Analyzer")
    print(f"Scanning {len(files)} C# file(s) in: {root}\n")

    all_findings: list[dict] = []
    for f in files:
        all_findings.extend(scan_file(f))

    if args.severity == "HIGH":
        all_findings = [f for f in all_findings if f["severity"] == "HIGH"]
    elif args.severity == "MED":
        all_findings = [f for f in all_findings if f["severity"] in ("HIGH", "MED")]

    if not all_findings:
        print("✅ No physics API misuse patterns detected.")
        sys.exit(0)

    for finding in sorted(all_findings, key=lambda x: (x["severity"] != "HIGH", x["file"], x["line"])):
        print(f"⚠️  [{finding['severity']}] {finding['id']}")
        print(f"   File:   {finding['file']}:{finding['line']}")
        print(f"   Method: {finding['method']}()")
        print(f"   Issue:  {finding['message']}")
        print(f"   Fix:    {finding['fix']}")
        print(f"   Code:   {finding['snippet']}")
        print()

    print(f"Total findings: {len(all_findings)}")
    sys.exit(1)


if __name__ == "__main__":
    main()
