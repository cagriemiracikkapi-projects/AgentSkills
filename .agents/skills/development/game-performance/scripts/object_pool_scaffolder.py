#!/usr/bin/env python3
import sys

def build_pool(name, custom_type):
    print(f"📦 Object Pool Scaffolder (Mock)")
    print(f"🔨 Generating Generic Pool manager for: {name} (Type: {custom_type})")
    print("...")
    print(f"✅ Created {name}.cs using UnityEngine.Pool.ObjectPool.")
    print("✅ Configured auto-expand capacity to 100.")
    print("✅ Injected standard OnGet() and OnRelease() hooks.")
    print(f"Ready to instantiate {custom_type} without GC spikes!")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python object_pool_scaffolder.py <PoolName> --type <ComponentType>")
        sys.exit(1)
    build_pool(sys.argv[1], sys.argv[3])
