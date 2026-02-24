# Core Web Vitals (CWV) Optimization

## Overview
Google's Core Web Vitals are the strict metrics used to measure user experience. Failing these metrics results in poor SEO rankings and massive bounce rates.

## 1. Largest Contentful Paint (LCP)

LCP measures loading performance. It marks the time when the largest text block or image element is rendered on screen. Your goal is under **2.5 seconds**.

### Optimization Rules:
- **Preload Critical Assets:** If your LCP is a hero image, you must tell the browser to download it immediately, before it even parses the CSS.
  ```html
  <link rel="preload" as="image" href="hero.webp" />
  ```
- **Serve Next-Gen Formats:** Never use PNG or JPEG for hero graphics unless absolutely necessary. Use WebP or AVIF.
- **Server-Side Rendering (SSR):** If your app is a plain React SPA, the user stares at a blank white screen while a 2MB Javascript bundle downloads. Use Next.js SSR to send fully rendered HTML on the first request.

## 2. First Input Delay (FID) / Interaction to Next Paint (INP)

FID measures interactivity. It's the time from when a user first interacts with a page (e.g., clicks a button) to the time the browser is actually able to begin processing event handlers. INP measures the overall responsiveness of the page across its entire lifecycle. Goal: under **100ms** (FID) / **200ms** (INP).

### Optimization Rules:
- **Break Up Long Tasks:** If Javascript locks the main thread for 500ms to parse a massive JSON payload, the browser cannot respond to a user clicking a button. Yield to the main thread utilizing Web Workers or `setTimeout`.
- **Defer Non-Critical Javascript:** Analytics, Chat widgets, and heavy third-party scripts should have the `defer` or `async` attribute.
  ```html
  <script src="heavy-analytics.js" defer></script>
  ```
- **Code Splitting:** Do not send 1 massive `bundle.js`. Send smaller chunks so the main thread parses less code upfront.

## 3. Cumulative Layout Shift (CLS)

CLS measures visual stability. It calculates how much the page layout shift unexpectedly while loading. Goal: under **0.1**.

### Optimization Rules:
- **Specify Dimensions:** Images and iframes MUST have explicit width and height attributes, preventing the browser from repainting the layout when the image finally loads.
  ```html
  <!-- BAD: The browser doesn't know how tall this is until it downloads -->
  <img src="banner.jpg" alt="Banner" style="width: 100%" />
  
  <!-- GOOD: The browser allocates space immediately -->
  <img src="banner.jpg" alt="Banner" width="1200" height="600" style="width: 100%; height: auto;" />
  ```
- **Pre-allocate Ad/Banner Slots:** If you have an ad slot that takes 2 seconds to load via an external network, place a CSS placeholder `min-height` on its container so the content below it doesn't get pushed down dynamically.
- **Don't insert dynamic UI above existing UI:** Unless responding directly to a user interaction, do not dynamically insert a "Subscribe Newsletter" banner at the very top of the page after the user has begun reading.
