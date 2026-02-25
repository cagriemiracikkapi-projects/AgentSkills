---
name: development/frontend-performance
description: Toolkit for diagnosing and resolving Web Vitals issues (LCP, FID, CLS), profiling rendering loops, and optimizing JavaScript bundles. Use when an application feels sluggish, load times exceed 3 seconds, or React/Vue apps suffer from excessive re-renders.
---

# Skill: Frontend Performance

Comprehensive architectural guidelines and tools for achieving 60fps rendering and lightning-fast load times.

## Quick Start

> **Script Paths:** Gemini/Codex/cursorlike: `.agent_scripts/development_frontend-performance/`. Claude (folder mode): `.claude/skills/development/frontend-performance/scripts/`.

### Main Capabilities

This skill provides three core capabilities through automated scripts:

```bash
# Script 1: Bundle Size Analyzer
node .agent_scripts/development_frontend-performance/bundle_analyzer.js [options]

# Script 2: Unused CSS/JS Purger
node .agent_scripts/development_frontend-performance/asset_purger.js [options]

# Script 3: React Re-render Profiler
node .agent_scripts/development_frontend-performance/react_profiler_parser.js [options]
```

## Core Capabilities

### 1. Bundle Size Analyzer

Automates the scanning of webpack/vite build outputs to identify massive dependencies (like `lodash` or `moment`) that should be tree-shaken or replaced.

**Features:**
- Identifies duplicate dependencies in the lockfile
- Maps visual tree-maps of chunk sizes
- Suggests dynamic import (`React.lazy()`) split points

**Usage:**
```bash
node .agent_scripts/development_frontend-performance/bundle_analyzer.js ./dist/stats.json
```

### 2. Asset Purger

Scans HTML and JSX files to find and remove CSS classes or unused exported Javascript functions that made it into the final build.

**Features:**
- Integrates with PurgeCSS concepts
- Identifies dead code paths
- Warns about unoptimized images (> 200kb)

**Usage:**
```bash
node .agent_scripts/development_frontend-performance/asset_purger.js ./src/ --build-dir ./dist/
```

### 3. React Profiler Parser

Parses the JSON output from the React DevTools Profiler to mathematically identify which components are rendering for the longest duration, and why.

**Features:**
- Finds components rendering > 16ms
- Identifies missing `useMemo` / `useCallback` opportunities
- Tracks down "Context Thrashing" where a global context update re-renders the entire tree

**Usage:**
```bash
node .agent_scripts/development_frontend-performance/react_profiler_parser.js profile_trace.json
```

## Reference Documentation

### Core Web Vitals (CWV)

Comprehensive guide available in `references/core_web_vitals.md`:

- **LCP (Largest Contentful Paint):** Preloading hero images and Critical CSS.
- **FID (First Input Delay):** Breaking up long main-thread tasks with Web Workers or `setTimeout`.
- **CLS (Cumulative Layout Shift):** Setting explicit `width` and `height` on images to prevent the page from jumping.

### React/Vue Rendering Hacks

Technical reference guide in `references/rendering_optimization.md`:

- Referential Equality in React (`Object.is`)
- When to use `React.memo` (and when NOT to, as memoization has a cost)
- List Virtualization techniques (`react-window`)

## Tech Stack

**Tools:** Lighthouse, Webpack Bundle Analyzer, React DevTools Profiler
**Metrics:** LCP, FID, CLS, TTFB, TTI
**Concepts:** Tree-shaking, Code-splitting, Critical CSS, Web Workers

## Best Practices Summary

### JavaScript Execution
- Do not let a single synchronous JavaScript block run for longer than 50ms. Yield to the main thread so the browser can paint.
- Load heavy libraries (like charting or 3D rendering) on demand when the user clicks the open button, NOT on initial page load.

### Asset Delivery
- Serve images in WebP or AVIF formats.
- Preconnect (`<link rel="preconnect">`) to critical third-party domains (like Google Fonts or APIs) early in the `<head>`.

## Resources

- Web Vitals Guide: `references/core_web_vitals.md`
- Rendering Guide: `references/rendering_optimization.md`
- Utilities: `.agent_scripts/development_frontend-performance/` directory
