#!/usr/bin/env python3
import sys

def recommend():
    print(f"🗂️ Index Recommender (Mock)")
    if len(sys.argv) > 1:
        print(f"🔍 Analyzing Target Query")
    print("...")
    print("The query filters by `status` and orders by `created_at`.")
    print("💡 Recommended Index (Composite B-Tree):")
    print("   CREATE INDEX idx_status_created_at ON table_name (status, created_at DESC);")
    print("This will satisfy both the WHERE filter and the SORT without a heavy explicit sort operation.")

if __name__ == "__main__":
    recommend()
