#!/usr/bin/env python3
import sys

def scan():
    print(f"🔬 GC Allocation Scanner (Mock)")
    if len(sys.argv) > 1:
        print(f"📂 Scanning directory: {sys.argv[1]}")
    print("...")
    print("⚠️ ALLOCATION DETECTED in Update():")
    print("   File: Assets/Scripts/PlayerController.cs:42")
    print("   Code: 'healthText.text = \"HP: \" + currentHp;'")
    print("   Recommendation: Use StringBuilder or TextMeshPro.SetText(string, float).")
    print("")
    print("⚠️ LINQ USAGE IN HOT PATH:")
    print("   File: Assets/Scripts/EnemyManager.cs:115")
    print("   Code: 'var active = enemies.Where(e => e.isActive).ToList();'")
    print("   Recommendation: Replace with a standard `for` loop to avoid IEnumerator allocations.")

if __name__ == "__main__":
    scan()
