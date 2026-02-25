#!/usr/bin/env python3
"""Generate OpenAPI 3.1.0 spec from Express/FastAPI/Gin route declarations."""
import argparse
import json
import re
from pathlib import Path


# Express/Koa: app.get('/path', ...) or router.post('/path', ...)
EXPRESS_RE = re.compile(
    r"\b(?:app|router)\.(get|post|put|patch|delete)\(\s*['\"]([^'\"]+)['\"]",
    re.IGNORECASE,
)
# FastAPI: @app.get("/path") or @router.post("/path")
FASTAPI_RE = re.compile(
    r"@(?:app|router)\.(get|post|put|patch|delete)\(\s*['\"]([^'\"]+)['\"]",
    re.IGNORECASE,
)
# Gin: r.GET("/path", ...) or router.POST("/path", ...)
GIN_RE = re.compile(
    r"\b(?:r|router|group)\.(GET|POST|PUT|PATCH|DELETE)\(\s*\"([^\"]+)\"",
)

PATH_PARAM_RE = re.compile(r":(\w+)|<(\w+)(?::[^>]*)?>|\{(\w+)\}")


def extract_path_params(route: str) -> list[dict]:
    """Extract path parameter names and return OpenAPI parameter objects."""
    params = []
    for m in PATH_PARAM_RE.finditer(route):
        name = m.group(1) or m.group(2) or m.group(3)
        params.append({
            "name": name,
            "in": "path",
            "required": True,
            "schema": {"type": "string"},
            "description": f"Path parameter: {name}",
        })
    return params


def normalize_route(route: str) -> str:
    """Convert Express :param and FastAPI <param> to OpenAPI {param} style."""
    route = re.sub(r":(\w+)", r"{\1}", route)
    route = re.sub(r"<(\w+)(?::[^>]*)?>", r"{\1}", route)
    return route


def scan_routes(src_folder: Path):
    routes = []
    for file_path in src_folder.rglob("*"):
        if file_path.suffix.lower() not in {".js", ".ts", ".py", ".go"}:
            continue
        try:
            content = file_path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        for pattern in (EXPRESS_RE, FASTAPI_RE, GIN_RE):
            for match in pattern.finditer(content):
                method = match.group(1).lower()
                route = match.group(2)
                routes.append((method, route, str(file_path)))
    return routes


def build_openapi(routes):
    doc = {
        "openapi": "3.1.0",
        "info": {"title": "Generated API", "version": "1.0.0"},
        "paths": {},
    }
    for method, raw_route, source_file in routes:
        oa_route = normalize_route(raw_route)
        path_params = extract_path_params(raw_route)
        path_item = doc["paths"].setdefault(oa_route, {})

        operation: dict = {
            "summary": f"{method.upper()} {oa_route}",
            "description": f"Auto-generated from: {source_file}",
            "responses": {
                "200": {"description": "Success"},
                "400": {"description": "Bad Request"},
                "404": {"description": "Not Found"},
                "500": {"description": "Internal Server Error"},
            },
        }
        if path_params:
            operation["parameters"] = path_params

        if method in ("post", "put", "patch"):
            operation["requestBody"] = {
                "required": True,
                "content": {
                    "application/json": {
                        "schema": {"type": "object"},
                    }
                },
            }

        path_item[method] = operation
    return doc


def main():
    parser = argparse.ArgumentParser(
        description="Generate OpenAPI 3.1.0 spec from Express/FastAPI/Gin route declarations."
    )
    parser.add_argument("src_folder", help="Source folder to scan")
    parser.add_argument("--output", default="openapi.json", help="Output file path")
    parser.add_argument("--title", default="Generated API", help="API title")
    parser.add_argument("--version", default="1.0.0", help="API version")
    args = parser.parse_args()

    src = Path(args.src_folder)
    if not src.exists():
        raise SystemExit(f"Source folder does not exist: {src}")

    routes = scan_routes(src)
    spec = build_openapi(routes)
    spec["info"]["title"] = args.title
    spec["info"]["version"] = args.version

    Path(args.output).write_text(json.dumps(spec, indent=2), encoding="utf-8")
    print(f"✅ OpenAPI 3.1.0 spec written to: {args.output}")
    print(f"📌 Routes discovered: {len(routes)}")
    if routes:
        for method, route, _ in routes[:10]:
            print(f"   {method.upper():6} {normalize_route(route)}")
        if len(routes) > 10:
            print(f"   ... and {len(routes) - 10} more")


if __name__ == "__main__":
    main()
