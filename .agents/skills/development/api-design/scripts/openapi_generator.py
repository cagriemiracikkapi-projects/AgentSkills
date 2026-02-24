#!/usr/bin/env python3
import argparse
import json
import re
from pathlib import Path


ROUTE_RE = re.compile(r"\b(?:app|router)\.(get|post|put|patch|delete)\(\s*['\"]([^'\"]+)['\"]")


def scan_routes(src_folder: Path):
    routes = []
    for file_path in src_folder.rglob("*"):
        if file_path.suffix.lower() not in {".js", ".ts", ".py"}:
            continue
        try:
            content = file_path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        for match in ROUTE_RE.finditer(content):
            method = match.group(1).lower()
            route = match.group(2)
            routes.append((method, route))
    return routes


def build_openapi(routes):
    doc = {
        "openapi": "3.0.0",
        "info": {"title": "Generated API", "version": "1.0.0"},
        "paths": {}
    }
    for method, route in routes:
        path_item = doc["paths"].setdefault(route, {})
        path_item[method] = {
            "summary": f"{method.upper()} {route}",
            "responses": {
                "200": {"description": "Success"},
                "400": {"description": "Bad Request"},
                "500": {"description": "Internal Server Error"}
            }
        }
    return doc


def main():
    parser = argparse.ArgumentParser(description="Generate basic OpenAPI spec from route declarations.")
    parser.add_argument("src_folder", help="Source folder to scan")
    parser.add_argument("--output", default="openapi.json", help="Output file path")
    args = parser.parse_args()

    src = Path(args.src_folder)
    if not src.exists():
        raise SystemExit(f"Source folder does not exist: {src}")

    routes = scan_routes(src)
    spec = build_openapi(routes)
    Path(args.output).write_text(json.dumps(spec, indent=2), encoding="utf-8")
    print(f"✅ OpenAPI spec written to: {args.output}")
    print(f"📌 Routes discovered: {len(routes)}")


if __name__ == "__main__":
    main()
