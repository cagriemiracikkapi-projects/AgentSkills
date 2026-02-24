#!/usr/bin/env python3
import sys

def analyze():
    print(f"⚙️ Physics Profiler Analyzer (Mock)")
    print("Scanning code for Physics API misuse...")
    print("...")
    print("⚠️ WARNING: transform.position modified directly on an active Rigidbody.")
    print("   File: Assets/Scripts/Platform.cs:22")
    print("   Recommendation: Use Rigidbody.MovePosition() inside FixedUpdate to prevent physics interpolation stutter.")
    print("")
    print("⚠️ SPAM DETECTED: Physics.Raycast called 50 times/frame.")
    print("   Recommendation: Switch to Physics.RaycastNonAlloc and reuse a pre-allocated RaycastHit array.")

if __name__ == "__main__":
    analyze()
