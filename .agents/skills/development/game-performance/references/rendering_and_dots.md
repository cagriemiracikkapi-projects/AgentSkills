# Rendering Performance & DOTS (Data-Oriented Technology Stack)

## Overview
This reference guide covers the principles of pushing millions of polygons to the screen without bottlenecking the CPU, and when to abandon traditional Object-Oriented C# for Data-Oriented Design.

## 1. CPU vs GPU Boundaries

Before optimizing, locate the bottleneck using the Unity Profiler.
- **CPU Bound:** The physics engine, AI scripts, or Garbage Collection are taking too long. Frame rate drops, but GPU utilization is low.
- **GPU Bound:** Too many complex shaders, overdraw (transparency), or post-processing effects. The CPU is waiting for the GPU to finish drawing.

## 2. Draw Calls and SetPass Calls

Every unique Material or Mesh requires the CPU to send instructions to the GPU (a Draw Call). Changing shader states (a SetPass call) is even more expensive.

### Rule: Batching is Mandatory

1. **Static Batching:** If a GameObject never moves (buildings, terrain), check "Static" in the Inspector. Unity will combine their meshes at build time into one giant mesh, reducing thousands of draw calls into one.
2. **GPU Instancing:** If you have 500 identical barrels, ensure your shader supports GPU Instancing. The CPU will tell the GPU "Draw this barrel mesh 500 times at these 500 positions" in a single call.
3. **Texture Atlasing:** Combining 10 small UI textures into 1 large sprite sheet allows the UI Canvas to draw all 10 elements in a single SetPass call.

## 3. UI Optimization (Canvas Rebuilds)

Unity UI (uGUI) is notoriously slow if built incorrectly.

### Rule: Separate Dynamic UI from Static UI
When ONE element on a Canvas changes (e.g., a Score number changes from 0 to 1), the ENTIRE Canvas is marked as "dirty" and must be rebuilt by the CPU.

**Solution:**
Place static graphics (health bar frames, minimap borders) on one Canvas. Place rapidly updating text (Score, Health numbers) on a separate sub-Canvas. Evolving the nested canvas prevents the static canvas from rebuilding.

## 4. Introduction to DOTS and ECS

When attempting to simulate 10,000 independent moving troops, traditional `MonoBehaviour` `Update()` loops will fail. The CPU cache becomes scattered (Cache Misses) because `class` instances are fragmented across the Heap memory.

### The Solution: Entity Component System (ECS)
ECS abandons Object-Oriented Design.
- **Entities:** An ID.
- **Components:** Pure data `structs` containing no logic (e.g., `Translation`, `Velocity`). Packed tightly in continuous memory arrays (Chunks).
- **Systems:** Logic that iterates over arrays of Components.

### The Burst Compiler
Translates C# jobs into highly optimized native machine code. It requires your C# code to use NO reference types (no classes, no strings) and rely entirely on native collections (`NativeArray`, `NativeHashMap`).

### Rule of Migration:
Do not use ECS for your UI, Player Controller, or Game Manager. Use it EXCLUSIVELY for massive simulations (flocking birds, thousands of projectiles, deep pathfinding logic).
