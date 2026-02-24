---
name: development/game-performance
description: Unity/C# memory management, DOTS/ECS guidelines, and physics optimization.
---

# Skill: Game Performance

Specialized techniques for C# and Unity to maintain rock-solid frame rates and prevent memory fragmentation.

## Capabilities
- Implementing Object Pools to prevent Instantiate/Destroy overhead.
- Writing GC-Free Code on hot paths (`Update`, `FixedUpdate`).
- Profiling frame times and identifying draw call bottlenecks.
- Implementing Burst-Compiled Jobs (Unity DOTS/ECS).

## Core Rule
The Garbage Collector is the enemy of smooth gameplay. Avoid `new` and LINQ in per-frame logic.
