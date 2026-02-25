#!/usr/bin/env python3
"""Map import dependencies across Python/JS/TS files and detect architecture violations + circular deps."""
import argparse
import ast
import re
import sys
from collections import defaultdict
from pathlib import Path


# Layer assignment heuristics (directory name fragments → layer)
LAYER_MAP = {
    "ui": "ui", "view": "ui", "component": "ui", "page": "ui",
    "controller": "application", "handler": "application", "api": "application",
    "service": "domain", "domain": "domain", "usecase": "domain",
    "repository": "infrastructure", "repo": "infrastructure",
    "db": "infrastructure", "database": "infrastructure", "orm": "infrastructure",
    "infra": "infrastructure", "infrastructure": "infrastructure",
}

# Forbidden cross-layer imports (from_layer → set of disallowed target layers)
VIOLATIONS: dict[str, set[str]] = {
    "ui": {"infrastructure"},
    "application": {"infrastructure"},
    "domain": {"infrastructure", "application", "ui"},
}

JS_IMPORT_RE = re.compile(
    r"""(?:import\s+(?:[^'"]+from\s+)?['"]([^'"]+)['"]|require\s*\(\s*['"]([^'"]+)['"]\s*\))""",
    re.MULTILINE,
)


def get_layer(path: Path) -> str:
    parts = [p.lower() for p in path.parts]
    for part in parts:
        for fragment, layer in LAYER_MAP.items():
            if fragment in part:
                return layer
    return "unknown"


def extract_python_imports(file_path: Path) -> list[str]:
    try:
        tree = ast.parse(file_path.read_text(encoding="utf-8", errors="ignore"))
    except SyntaxError:
        return []
    imports = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                imports.append(alias.name)
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                imports.append(node.module)
    return imports


def extract_js_imports(file_path: Path) -> list[str]:
    try:
        content = file_path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return []
    results = []
    for m in JS_IMPORT_RE.finditer(content):
        target = m.group(1) or m.group(2)
        if target:
            results.append(target)
    return results


def collect_graph(root: Path) -> dict[str, list[str]]:
    graph: dict[str, list[str]] = defaultdict(list)
    for file_path in root.rglob("*"):
        if file_path.suffix.lower() == ".py":
            imports = extract_python_imports(file_path)
        elif file_path.suffix.lower() in {".js", ".ts", ".jsx", ".tsx"}:
            imports = extract_js_imports(file_path)
        else:
            continue
        rel = str(file_path.relative_to(root))
        for imp in imports:
            if imp.startswith(".") or (not imp.startswith("@") and "/" in imp):
                graph[rel].append(imp)
    return graph


def detect_layer_violations(root: Path) -> list[dict]:
    findings = []
    for file_path in root.rglob("*"):
        if file_path.suffix.lower() == ".py":
            imports = extract_python_imports(file_path)
        elif file_path.suffix.lower() in {".js", ".ts", ".jsx", ".tsx"}:
            imports = extract_js_imports(file_path)
        else:
            continue

        src_layer = get_layer(file_path)
        forbidden = VIOLATIONS.get(src_layer, set())
        if not forbidden:
            continue

        try:
            content = file_path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        lines = content.splitlines()

        for imp in imports:
            imp_layer = get_layer(Path(imp.replace(".", "/").replace("@", "")))
            if imp_layer in forbidden:
                line_no = 1
                for i, line in enumerate(lines, 1):
                    if imp in line:
                        line_no = i
                        break
                findings.append({
                    "file": str(file_path),
                    "line": line_no,
                    "src_layer": src_layer,
                    "target_layer": imp_layer,
                    "import": imp,
                })
    return findings


def detect_circular(graph: dict[str, list[str]]) -> list[list[str]]:
    cycles = []
    visited: set[str] = set()
    path: list[str] = []
    path_set: set[str] = set()

    def dfs(node: str):
        if node in path_set:
            cycle_start = path.index(node)
            cycles.append(path[cycle_start:] + [node])
            return
        if node in visited:
            return
        visited.add(node)
        path.append(node)
        path_set.add(node)
        for neighbour in graph.get(node, []):
            dfs(neighbour)
        path.pop()
        path_set.discard(node)

    for node in list(graph.keys()):
        dfs(node)

    seen: set[frozenset] = set()
    unique = []
    for c in cycles:
        key = frozenset(c)
        if key not in seen:
            seen.add(key)
            unique.append(c)
    return unique[:10]


def main():
    parser = argparse.ArgumentParser(
        description="Map import dependencies and detect architecture violations & circular deps."
    )
    parser.add_argument("target", help="Source directory to analyze")
    parser.add_argument("--no-violations", action="store_true", help="Skip layer violation check")
    parser.add_argument("--no-circular", action="store_true", help="Skip circular dependency check")
    args = parser.parse_args()

    root = Path(args.target)
    if not root.exists():
        raise SystemExit(f"Target does not exist: {root}")

    print("🕸️  Architecture Dependency Mapper")
    print(f"Scanning: {root}\n")

    violations = [] if args.no_violations else detect_layer_violations(root)
    graph = {} if args.no_circular else collect_graph(root)
    cycles = [] if args.no_circular else detect_circular(graph)

    if violations:
        print(f"🚨 LAYER VIOLATIONS ({len(violations)} found):")
        for v in violations:
            print(f"  [{v['src_layer'].upper()} → {v['target_layer'].upper()}] {v['file']}:{v['line']}")
            print(f"    import: {v['import']}")
    else:
        print("✅ No layer violations detected.")

    print()

    if cycles:
        print(f"♻️  CIRCULAR DEPENDENCIES ({len(cycles)} found):")
        for cycle in cycles:
            print(f"  {' → '.join(cycle)}")
    else:
        print("✅ No circular dependencies detected.")

    total_issues = len(violations) + len(cycles)
    print(f"\nTotal issues: {total_issues}")
    sys.exit(1 if total_issues > 0 else 0)


if __name__ == "__main__":
    main()
