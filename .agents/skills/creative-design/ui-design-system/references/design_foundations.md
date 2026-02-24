# Core Design Foundations

## Overview
This reference guide establishes the mathematical rules that separate "okay" interfaces from pixel-perfect, highly professional designs.

## 1. The 8-Point Grid System

Never guess spacing. The human eye detects inconsistencies easily.
All margins, paddings, and structural dimensions MUST be multiples of 8. For tighter typography details, multiples of 4 are allowed as a half-step.

### The Scale:
- `spacing-1`: 4px (0.25rem) - Used for tight component internals.
- `spacing-2`: 8px (0.5rem) - Used for related items.
- `spacing-3`: 12px (0.75rem)
- `spacing-4`: 16px (1rem) - The base standard gap.
- `spacing-6`: 24px (1.5rem)
- `spacing-8`: 32px (2rem) - Used for distinct component separation.
- `spacing-12`: 48px (3rem)
- `spacing-16`: 64px (4rem) - Used for layout sectioning.

**Application:** Setting padding on a button to `12px 24px` instead of `10px 20px` instantly makes it look more robust and aligned with the broader grid.

## 2. Modular Typography

Typography should scale mathematically, not arbitrarily. Use `rem` units so the text scales if the user adjusts their browser's default font size.

### The Scale (Based on a Major Third ratio 1.250):
Assuming root `1rem = 16px`:
- `text-xs`: 0.8rem (12.8px) - Legal text, tiny badges.
- `text-sm`: 0.9rem (14.4px) - Secondary text, captions.
- `text-base`: 1rem (16px) - Body copy.
- `text-lg`: 1.25rem (20px) - Large body, subheadings.
- `text-xl`: 1.563rem (25px) - Small headings (H4).
- `text-2xl`: 1.953rem (31.2px) - Medium headings (H3).
- `text-3xl`: 2.441rem (39px) - Large headings (H2).
- `text-4xl`: 3.052rem (48.8px) - Hero headings (H1).

### Line Height (Leading)
- **Body text:** 1.5 - 1.7 (Improves readability across long lines).
- **Headings:** 1.1 - 1.2 (Large text looks disjointed if the line height is too high).

## 3. Semantic Color Architecture

Do not hardcode specific hex colors like `#FF0000` for an error. If the brand redesigns, you have to find and replace hundreds of files.

### Token Structure
1. **Primitives:** The foundational palette (e.g., `blue-100` through `blue-900`).
2. **Semantics:** How the primitive is used (e.g., `color-primary`, `color-success`, `color-danger`).
3. **Components:** Where the semantic color is applied (e.g., `button-bg-hover`).

```css
:root {
  /* Primitives */
  --blue-500: #3b82f6;
  --red-500: #ef4444;
  --gray-900: #111827;
  --white: #ffffff;

  /* Semantics */
  --text-primary: var(--gray-900);
  --text-inverse: var(--white);
  --bg-brand: var(--blue-500);
  --border-error: var(--red-500);
}

@media (prefers-color-scheme: dark) {
  :root {
    /* Semantics easily swap instantly for dark mode */
    --text-primary: var(--white);
    --text-inverse: var(--gray-900);
  }
}
```
