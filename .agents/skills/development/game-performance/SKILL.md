---
name: development/game-performance
description: Complete toolkit for C# memory optimization, Unity rendering performance, and Physics profiling. Use when the game drops below 60FPS on target hardware, when Garbage Collection causes stuttering, or when transferring Monobehaviour logic to DOTS/ECS.
---

# Skill: Game Performance & Unity Architecture

Comprehensive guidelines and tools for building strictly optimized, zero-allocation game loops.

## Quick Start

### Main Capabilities

This skill provides three core capabilities through automated scripts:

```bash
# Script 1: GC Allocation Scanner
python scripts/gc_allocation_scanner.py [options]

# Script 2: Object Pool Scaffolder
python scripts/object_pool_scaffolder.py [options]

# Script 3: Physics Profiler Analysis
python scripts/physics_profiler_analyzer.py [options]
```

## Core Capabilities

### 1. GC Allocation Scanner

Parses C# files to identify operations that will generate Garbage Collection in the Mono/IL2CPP runtime, causing micro-stutters.

**Features:**
- Highlights string formatting/concatenation inside `Update()` loops.
- Warns against LINQ usage and boxing/unboxing operations in hot-paths.
- Identifies missing caching for `GetComponent` or `Camera.main`.

**Usage:**
```bash
python scripts/gc_allocation_scanner.py Assets/Scripts/
```

### 2. Object Pool Scaffolder

Automatically generates optimized Generic Object Pooling boilerplate for frequently instantiated prefabs (like bullets or enemies).

**Features:**
- Implements `IObjectPool` interface standard
- Creates auto-expanding arrays to avoid index out-of-bounds
- Configures `OnGet` and `OnRelease` reset hooks securely

**Usage:**
```bash
python scripts/object_pool_scaffolder.py BulletManager --type Projectile
```

### 3. Physics Profiler Analyzer

Analyzes Unity Physics logic to flag bottlenecks before you open the Profiler window.

**Features:**
- Warns against changing `.transform.position` on Rigidbodies outside of `FixedUpdate`.
- Checks for excessive Raycast allocations (suggests `RaycastNonAlloc`).
- Highlights complex Mesh Colliders that should be primitive capsules/boxes.

**Usage:**
```bash
python scripts/physics_profiler_analyzer.py Assets/Scripts/Physics/
```

## Reference Documentation

### Memory Management & C# Optimization

Comprehensive guide available in `references/memory_optimization.md`:

- Structs vs Classes and Stack vs Heap allocation
- Avoiding Boxing/Unboxing
- The cost of Unity Coroutines vs Async/Await (UniTask)

### Engine Rendering & DOTS

Technical reference guide in `references/rendering_and_dots.md`:

- Draw Calls, SetPass Calls, and Batching (Static/Dynamic/Instancing)
- When to migrate from OOP (Object-Oriented Programming) to DOD (Data-Oriented Design)
- Using the Burst Compiler and C# Job System for multi-threading

## Tech Stack

**Engine:** Unity (URP, HDRP, Built-in)
**Language:** C#
**Architectures:** MonoBehaviour, DOTS (Entity Component System)
**Concepts:** Object Pooling, Garbage Collection, Multi-threading (Jobs)

## Development Workflow

### 1. Identify the Bottleneck
Before refactoring, check the Unity Profiler. Is the delay orange (Physics), blue (Scripts), or yellow (VSync/Render)?
- Use `scripts/gc_allocation_scanner.py` to eliminate script-based stutters.

### 2. Fix Allocations
- In C#, allocations block the main thread. Replace `new[]` arrays in `Update` with statically defined class arrays.

### 3. Move to Jobs (If Necessary)
If you have 500+ enemies pathfinding simultaneously, `MonoBehaviour` `Update` loops will choke. Migrate the logic to an `IJobParallelFor` using the Burst compiler.

## Best Practices Summary

### Coding Standards
- Never use `FindObjectOfType` or `GameObject.Find` after `Awake()`.
- Use localized string Builders (`StringBuilder`) if text updates per-frame (e.g., a Timer).

### Physics
- If an object never moves, mark it "Static".
- Layer Collision Matrix: Uncheck collisions between layers that never interact (e.g., UI should not collide with Player).

## Troubleshooting

### Random Stutters every 3 seconds
- The Garbage Collector is running. Look for `Update()` loops that create new Objects, Strings, or Arrays.

### CPU Bound vs GPU Bound
- **CPU Bound:** Lower Physics Timesteps, stop using complex AI in `Update`, use Object Pooling.
- **GPU Bound:** Reduce material count, bake lighting, enable GPU Instancing for foliage/enemies.

## Resources

- Memory Guide: `references/memory_optimization.md`
- Rendering & ECS Guide: `references/rendering_and_dots.md`
- Utilities: `scripts/` directory
