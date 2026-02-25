#!/usr/bin/env python3
"""Cyclomatic complexity analyzer for Python and JS/TS files."""
import argparse
import ast
import re
import sys
from pathlib import Path


GOD_METHOD_LINES = 60

JS_BRANCH_RE = re.compile(
    r"\b(if|else\s+if|else|for|while|switch|case|catch)\b|&&|\|\||\?"
)
JS_METHOD_RE = re.compile(
    r"""(?:(?:async\s+)?function\s*\*?\s*(\w+)\s*\([^)]*\)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>)|\b(\w+)\s*\([^)]*\)\s*\{)"""
)


# ---------- Python AST visitor ----------

class ComplexityVisitor(ast.NodeVisitor):
    BRANCH_NODES = (
        ast.If, ast.For, ast.While, ast.ExceptHandler,
        ast.With, ast.AsyncWith, ast.AsyncFor,
    )

    def __init__(self, source_lines: list[str]):
        self.source_lines = source_lines
        self.findings: list[dict] = []

    def _count_branches(self, node) -> int:
        count = 1
        for child in ast.walk(node):
            if isinstance(child, self.BRANCH_NODES):
                count += 1
            elif isinstance(child, ast.BoolOp):
                count += len(child.values) - 1
        return count

    def _func_body_lines(self, node) -> int:
        if not node.body:
            return 0
        first = node.body[0].lineno
        last = getattr(node.body[-1], "end_lineno", node.body[-1].lineno)
        return last - first + 1

    def _analyze_func(self, node):
        cc = self._count_branches(node)
        body_lines = self._func_body_lines(node)
        snippet = ""
        if node.lineno <= len(self.source_lines):
            snippet = self.source_lines[node.lineno - 1].strip()
        self.findings.append({
            "name": node.name,
            "line": node.lineno,
            "complexity": cc,
            "body_lines": body_lines,
            "snippet": snippet,
        })

    def visit_FunctionDef(self, node):
        self._analyze_func(node)
        self.generic_visit(node)

    def visit_AsyncFunctionDef(self, node):
        self._analyze_func(node)
        self.generic_visit(node)


# ---------- JS/TS analysis (regex-based) ----------

def analyze_js_file(file_path: Path, threshold: int) -> list[dict]:
    try:
        content = file_path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return []

    lines = content.splitlines()
    findings = []
    func_positions = []

    for m in JS_METHOD_RE.finditer(content):
        name = m.group(1) or m.group(2) or m.group(3) or "<anonymous>"
        # Skip keywords that aren't real function names
        if name in {"if", "else", "for", "while", "switch", "catch", "return"}:
            continue
        line_no = content[:m.start()].count("\n") + 1
        func_positions.append((name, line_no, m.start()))

    for name, line_no, start_pos in func_positions:
        brace_pos = content.find("{", start_pos)
        if brace_pos == -1:
            continue
        end_pos = brace_pos + 1
        depth = 1
        while end_pos < len(content) and depth > 0:
            ch = content[end_pos]
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
            end_pos += 1

        body = content[brace_pos:end_pos]
        body_lines = body.count("\n")
        cc = 1 + len(JS_BRANCH_RE.findall(body))
        snippet = lines[line_no - 1].strip() if line_no <= len(lines) else ""
        findings.append({
            "name": name,
            "line": line_no,
            "complexity": cc,
            "body_lines": body_lines,
            "snippet": snippet,
        })

    return findings


# ---------- Python ----------

def analyze_python_file(file_path: Path) -> list[dict]:
    try:
        source = file_path.read_text(encoding="utf-8", errors="ignore")
        tree = ast.parse(source)
    except (SyntaxError, OSError):
        return []
    visitor = ComplexityVisitor(source.splitlines())
    visitor.visit(tree)
    return visitor.findings


def report_findings(file_path: Path, findings: list[dict], threshold: int, god_lines: int) -> int:
    issues = 0
    for f in findings:
        cc = f["complexity"]
        body_lines = f["body_lines"]
        tags = []
        if cc > threshold:
            tags.append(f"CC={cc} > threshold={threshold}")
        if body_lines >= god_lines:
            tags.append(f"God Method ({body_lines} lines)")
        if tags:
            issues += 1
            print(f"  ⚠️  {f['name']}  line {f['line']}  [{', '.join(tags)}]")
            if f["snippet"]:
                print(f"      {f['snippet']}")
    return issues


def main():
    parser = argparse.ArgumentParser(
        description="Cyclomatic complexity analyzer for Python and JS/TS."
    )
    parser.add_argument("targets", nargs="+", help="Files or directories to analyze")
    parser.add_argument("--threshold", type=int, default=10,
                        help="Cyclomatic complexity threshold (default: 10)")
    parser.add_argument("--god-method-lines", type=int, default=GOD_METHOD_LINES,
                        help="Lines threshold for God Method smell (default: 60)")
    args = parser.parse_args()

    print("🧠 Cyclomatic Complexity Analyzer")
    print(f"Threshold: CC > {args.threshold} | God Method > {args.god_method_lines} lines\n")

    total_issues = 0
    total_funcs = 0

    for target_str in args.targets:
        target = Path(target_str)
        files: list[Path] = []
        if target.is_dir():
            files = [p for p in target.rglob("*")
                     if p.suffix.lower() in {".py", ".js", ".ts", ".jsx", ".tsx"}]
        elif target.is_file():
            files = [target]
        else:
            print(f"  [skip] not found: {target}")
            continue

        for file_path in sorted(files):
            if file_path.suffix.lower() == ".py":
                findings = analyze_python_file(file_path)
            else:
                findings = analyze_js_file(file_path, args.threshold)

            if not findings:
                continue

            total_funcs += len(findings)
            issues_in_file = sum(
                1 for f in findings
                if f["complexity"] > args.threshold or f["body_lines"] >= args.god_method_lines
            )

            if issues_in_file:
                print(f"📄 {file_path}")
                total_issues += report_findings(file_path, findings, args.threshold, args.god_method_lines)
                print()

    print(f"Functions analyzed: {total_funcs}")
    print(f"Issues found:       {total_issues}")
    sys.exit(1 if total_issues > 0 else 0)


if __name__ == "__main__":
    main()
