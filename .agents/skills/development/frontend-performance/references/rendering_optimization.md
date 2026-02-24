# React/Vue Rendering Optimization

## Overview
This reference guide establishes the hard rules for preventing the "Virtual DOM" from becoming the bottleneck in Single Page Applications (SPAs).

## 1. The React Re-render Rules

A React component re-renders if and only if:
1. Its state changes (`setState`).
2. Its parent component re-renders (this is the most dangerous rule).
3. The Context it consumes changes.

### Anti-Pattern: Prop Thrashing
If a Parent passes an object or arrow function to a Child, the Child will ALWAYS re-render when the Parent re-renders because `{} !== {}` in Javascript memory (Referential Inequality).

**Bad:**
```jsx
// The anonymous function is recreated every render
<SearchInput onChange={(text) => handleSearch(text)} />
// The style object is recreated every render
<SearchInput style={{ color: 'red' }} />
```

**Good:**
```jsx
const handleChange = useCallback((text) => handleSearch(text), [handleSearch]);
const style = useMemo(() => ({ color: 'red' }), []);

<SearchInput onChange={handleChange} style={style} />
```

## 2. When to Use `React.memo`

Do not wrap every component in `React.memo`. Memoization has a performance cost (it must perform shallow equality checks on all props).

### Use `React.memo` ONLY when:
- The component is heavy (e.g., a complex data table or a large chart).
- The component receives the same props frequently while its parent re-renders.

## 3. Context Thrashing

React Context is a sledgehammer. If you place your `user` object and your `theme` string inside the same Context Provider, EVERY component that reads the `theme` will re-render when the `user` updates.

### Fix: Split Contexts
Create a logically separated `ThemeProvider` and a separate `UserProvider`. 

### Better Fix: Atomic State (Zustand/Jotai)
For complex state, abandon Context for data sharing. Use Zustand or Redux, which allow components to subscribe to a *slice* of the state store, preventing re-renders if an unrelated slice changes.

## 4. List Virtualization

If you render a `<ul>` with 5,000 `<li>` elements, the browser will crash.
Use libraries like `react-window` or `react-virtuoso`.
These libraries only render the 20 items currently visible on the screen, recycling the DOM nodes as the user scrolls.
