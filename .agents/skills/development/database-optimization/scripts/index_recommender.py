#!/usr/bin/env python3
"""Recommend database indexes based on SQL query analysis."""
import argparse
import re
import sys


# --- SQL parsing patterns ---
WHERE_COL_RE = re.compile(
    r"\bWHERE\b(.*?)(?:\bGROUP\s+BY\b|\bORDER\s+BY\b|\bHAVING\b|\bLIMIT\b|$)",
    re.IGNORECASE | re.DOTALL,
)
COND_RE = re.compile(
    r"\b(\w+)\s*(?:[=<>!]+|BETWEEN|IN|LIKE|IS(?:\s+NOT)?)\s*",
    re.IGNORECASE,
)
JOIN_COL_RE = re.compile(
    r"\bJOIN\b[^ON]*\bON\b\s+(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)",
    re.IGNORECASE,
)
ORDER_RE = re.compile(
    r"\bORDER\s+BY\b\s+([\w\s,]+?)(?:\bLIMIT\b|$)",
    re.IGNORECASE | re.DOTALL,
)
ORDER_COL_RE = re.compile(r"\b(\w+)\s*(ASC|DESC)?", re.IGNORECASE)


def _clean_col(name: str) -> str:
    """Strip table prefix like table.column → column."""
    return name.split(".")[-1].strip()


def parse_where_cols(query: str) -> list[tuple[str, str]]:
    """Extract (column, operator_type) from WHERE clause. operator_type: eq|range"""
    cols = []
    m = WHERE_COL_RE.search(query)
    if not m:
        return cols
    clause = m.group(1)
    range_ops = re.compile(r"[<>]|BETWEEN|LIKE", re.IGNORECASE)
    for cond_m in COND_RE.finditer(clause):
        col = _clean_col(cond_m.group(1))
        # Determine if equality or range
        op_type = "range" if range_ops.search(cond_m.group(0)) else "eq"
        cols.append((col, op_type))
    return cols


def parse_join_cols(query: str) -> list[str]:
    cols = []
    for m in JOIN_COL_RE.finditer(query):
        cols.append(_clean_col(m.group(2)))
        cols.append(_clean_col(m.group(4)))
    return cols


def parse_order_cols(query: str) -> list[tuple[str, str]]:
    """Return list of (column, direction)."""
    cols = []
    m = ORDER_RE.search(query)
    if not m:
        return cols
    clause = m.group(1)
    for col_m in ORDER_COL_RE.finditer(clause):
        col = _clean_col(col_m.group(1))
        direction = (col_m.group(2) or "ASC").upper()
        if col.upper() not in {"ASC", "DESC", "BY"}:
            cols.append((col, direction))
    return cols


# --- Cardinality heuristics ---
HIGH_CARDINALITY_SUFFIXES = ("_id", "_uuid", "_token", "_key", "_hash", "_email")
LOW_CARDINALITY_SUFFIXES = ("_status", "_type", "_flag", "_bool", "_active", "_enabled")


def cardinality_rank(col: str) -> int:
    """Higher = higher cardinality (better leading index column)."""
    lower = col.lower()
    if any(lower.endswith(s) for s in HIGH_CARDINALITY_SUFFIXES):
        return 3
    if any(lower.endswith(s) for s in LOW_CARDINALITY_SUFFIXES):
        return 1
    return 2


def build_index_columns(
    where_cols: list[tuple[str, str]],
    join_cols: list[str],
    order_cols: list[tuple[str, str]],
) -> list[tuple[str, str]]:
    """
    Composite index column order rules:
    1. Equality WHERE columns first (sorted by cardinality desc)
    2. JOIN columns next
    3. Range WHERE columns
    4. ORDER BY columns last (preserving their direction)
    """
    seen: set[str] = set()
    result: list[tuple[str, str]] = []

    def add(col: str, direction: str = "ASC"):
        if col.lower() not in seen and col.upper() not in {"AND", "OR", "NOT", "NULL"}:
            seen.add(col.lower())
            result.append((col, direction))

    # 1. Equality columns by cardinality
    eq_cols = [(col, op) for col, op in where_cols if op == "eq"]
    eq_cols.sort(key=lambda x: cardinality_rank(x[0]), reverse=True)
    for col, _ in eq_cols:
        add(col)

    # 2. JOIN columns
    for col in join_cols:
        add(col)

    # 3. Range columns
    for col, op in where_cols:
        if op == "range":
            add(col)

    # 4. ORDER BY columns
    for col, direction in order_cols:
        add(col, direction)

    return result


def generate_create_index(table: str, columns: list[tuple[str, str]]) -> str:
    if not columns:
        return ""
    col_names = [c for c, _ in columns]
    col_exprs = []
    for col, direction in columns:
        col_exprs.append(f"{col} {direction}" if direction != "ASC" else col)
    idx_name = f"idx_{table}_{'_'.join(col_names[:4])}"
    return f"CREATE INDEX {idx_name} ON {table} ({', '.join(col_exprs)});"


def main():
    parser = argparse.ArgumentParser(
        description="Recommend database indexes from SQL query analysis."
    )
    parser.add_argument("--table", required=True, help="Table name to index")
    parser.add_argument("--query", required=True, help="SQL SELECT query to analyze")
    args = parser.parse_args()

    query = args.query
    table = args.table

    print("🗂️  Index Recommender")
    print(f"Table:  {table}")
    print(f"Query:  {query[:200]}{'...' if len(query) > 200 else ''}\n")

    where_cols = parse_where_cols(query)
    join_cols = parse_join_cols(query)
    order_cols = parse_order_cols(query)

    print("📋 Analysis:")
    if where_cols:
        print(f"  WHERE columns: {[c for c, _ in where_cols]}")
    if join_cols:
        print(f"  JOIN  columns: {join_cols}")
    if order_cols:
        print(f"  ORDER columns: {[c for c, _ in order_cols]}")

    index_cols = build_index_columns(where_cols, join_cols, order_cols)

    if not index_cols:
        print("\n⚠️  No indexable columns detected. Verify query contains WHERE/JOIN/ORDER BY.")
        sys.exit(1)

    sql = generate_create_index(table, index_cols)

    print(f"\n💡 Recommended Index:")
    print(f"   {sql}")

    # Explain the reasoning
    eq_names = [c for c, op in where_cols if op == "eq"]
    rng_names = [c for c, op in where_cols if op == "range"]
    ord_names = [c for c, _ in order_cols]

    if eq_names:
        print(f"\n   Equality predicates ({eq_names}) placed first.")
    if rng_names:
        print(f"   Range predicates ({rng_names}) placed after equality (index range scan).")
    if ord_names:
        print(f"   ORDER BY columns ({ord_names}) placed last to avoid filesort.")

    print("\n✅ Apply with care on large tables — prefer CONCURRENTLY for PostgreSQL.")


if __name__ == "__main__":
    main()
