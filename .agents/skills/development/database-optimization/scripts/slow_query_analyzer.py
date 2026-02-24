#!/usr/bin/env python3
import sys

def analyze():
    print(f"📈 Slow Query Analyzer (Mock)")
    if len(sys.argv) > 1:
        print(f"📂 Analyzing file: {sys.argv[1]}")
    print("...")
    print("⚠️ FOUND N+1 QUERY (Called 412 times in 10s):")
    print("   SELECT * FROM comments WHERE post_id = ?")
    print("   Recommendation: Use IN clause or DataLoader.")
    print("")
    print("⚠️ FULL TABLE SCAN DETECTED (Avg Time: 850ms):")
    print("   SELECT id, name FROM users WHERE lower(email) = ?")
    print("   Recommendation: Create an expression index: CREATE INDEX idx_lower_email ON users(lower(email));")

if __name__ == "__main__":
    analyze()
