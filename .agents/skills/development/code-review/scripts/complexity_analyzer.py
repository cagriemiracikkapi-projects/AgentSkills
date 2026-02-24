#!/usr/bin/env python3
import sys

def analyze():
    print(f"🧠 Cyclomatic Complexity & Smells Analyzer (Mock)")
    if len(sys.argv) > 1:
        print(f"📂 Analyzing targets: {sys.argv[1:]}")
    print("...")
    print("⚠️ SMELL: God Class Detected.")
    print("   File: src/services/OrderService.ts (850 lines).")
    print("   It is recommended to split this into OrderValidator, OrderMailer, and OrderRepository.")
    print("")
    print("⚠️ SMELL: Arrow Code (Deep Nesting).")
    print("   File: src/controllers/CheckoutController.ts:112")
    print("   Method `processPayment` has a Cyclomatic Complexity of 14 (Threshold: 10).")
    print("   Fix: Extract blocks into private methods or use Guard Clauses/Early Returns.")

if __name__ == "__main__":
    analyze()
