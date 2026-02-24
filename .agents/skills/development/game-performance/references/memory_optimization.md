# Memory Optimization in Unity (C#)

## Overview
This reference guide establishes the hard rules for managing the Managed Heap, avoiding the Garbage Collector (GC), and preventing frame drops in Unity games.

## 1. The Cost of Garbage Collection

In C#, every time you use the `new` keyword to instantiate an Object, Array, or String, memory is allocated on the Managed Heap. When the reference to that memory goes out of scope, the memory becomes "Garbage."
Unity's Garbage Collector (Boehm GC or Incremental GC) periodically freezes the main thread to clean up this garbage. This freeze causes micro-stutters.

**Rule:** Zero Allocations per Frame.
There should NEVER be memory allocation happening inside an `Update()`, `FixedUpdate()`, or `LateUpdate()` loop.

## 2. Common Allocation Anti-Patterns

### Anti-Pattern: String Concatenation in Loops
Strings are immutable in C#. Writing `scoreText.text = "Score: " + currentScore;` inside `Update()` creates a brand new string literal on the Heap every single frame.

**Solution:** 
Only update UI when the underlying value actually changes (Event-Driven UI). For numbers that change constantly (e.g., a Timer), pre-allocate a `StringBuilder` or use TextMeshPro's direct number appending APIs.

### Anti-Pattern: `GetComponent` and `Object.Find`
Calling `GetComponent<T>()` allocates memory under the hood and is slow.
Calling `GameObject.Find()` or `GameObject.FindGameObjectsWithTag()` is incredibly slow, as it searches the entire hierarchy.

**Solution:**
Cache references.
```csharp
private Rigidbody _rb;
private void Awake() {
    // Done once at startup. NEVER in Update.
    _rb = GetComponent<Rigidbody>(); 
}
```

### Anti-Pattern: LINQ in the Hot Path
LINQ (`.Where()`, `.Select()`, `.ToList()`) allocations are notorious in Unity. They create enumerators and hidden temporary arrays on the Heap.

**Solution:**
Use traditional `for` loops counting up to `.Length` or `.Count`.

## 3. Structs vs. Classes (Value Types vs Reference Types)

- **struct (Value Type):** Allocated on the Stack. Incredibly fast to create and destroy. Cleaned up immediately without the Garbage Collector.
- **class (Reference Type):** Allocated on the Heap. Triggers the GC.

**Rule:** If a data structure is small (like a `Vector3` or a `Color`), make it a `struct`.

## 4. Object Pooling

Instantiating (`Instantiate()`) and Destroying (`Destroy()`) Unity objects is the most expensive operation you can do during gameplay. It causes massive GC spikes and fragmentation.

### The Rule:
If an object is created and destroyed frequently (Bullets, Enemies, Damage Popups, Explosions), you MUST use an Object Pool.

1. On scene load, instantiate 100 Bullets and set them inactive (`gameObject.SetActive(false)`).
2. When the player shoots, take a bullet from the pool, set its position, and activate it.
3. When the bullet hits a wall, deactivate it and return it to the pool.
4. If the pool is empty, dynamically expand it (but only if strictly necessary).

## 5. Coroutines vs. Async/Await (UniTask)

Unity Coroutines generate a small amount of garbage every time you `yield return new WaitForSeconds(1f);`. (You can solve this by caching the `new WaitForSeconds` variable).

Modern Unity development prefers `Async/Await` using libraries like `UniTask`, which are structs underneath and generate zero allocations while allowing easier try/catch error handling.
