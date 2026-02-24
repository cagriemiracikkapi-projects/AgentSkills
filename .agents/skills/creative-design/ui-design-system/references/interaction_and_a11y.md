# Interaction & Accessibility (WCAG)

## Overview
This reference guide establishes the interaction patterns and accessibility constraints required for a professional, inclusive UI Design System. 

## 1. State Management

A component is not finished until all of its states are explicitly designed and styled.

### Required States for Interactive Elements (Buttons, Links, Inputs):
- **Default:** The baseline appearance.
- **Hover:** When a cursor rests over the element (Desktop). Usually a slight background darkening or elevation change.
- **Focus:** When navigated to via Keyboard (`Tab`). **CRITICAL:** Never set `outline: none` unless you provide a custom `box-shadow` to indicate focus. Users relying on keyboards must know where they are.
- **Active:** The split-second the element is clicked/pressed. Usually a slight scale-down (`transform: scale(0.98)`) or background darkening to provide tactile feedback.
- **Disabled:** Visually muted (`opacity: 0.5`) and logically disabled (`cursor: not-allowed; pointer-events: none`).

## 2. Keyboard Navigation & Focus Trapping

Interfaces must be navigable completely without a mouse.

### The Focus Ring
Browsers provide a default focus ring (a blue glow). If it doesn't match the brand, override it, but do not remove it.
```css
/* Good approach to custom focus rings */
.custom-button:focus-visible {
  outline: 2px solid var(--blue-500);
  outline-offset: 2px;
}
/* Prevents mouse clicks from triggering the ring, keeps it for keyboards */
.custom-button:focus:not(:focus-visible) {
  outline: none;
}
```

### Focus Trapping (Modals & Drawers)
When a user opens a Modal, their `Tab` key must be "trapped" inside the modal. 
If they press `Tab` on the last button in the modal, the focus must loop back to the first input in the modal. It should NEVER jump back to the obscured background page. 
Use a library like `focus-trap-react` or write a vanilla JS event listener to handle this.

## 3. Screen Reader Semantics (ARIA)

If an element is purely visual (e.g., a decorative SVG), screen readers should ignore it. If it conveys meaning, they must read it.

### Roles and Labels
- **Icon Buttons:** A button that is just a magnifying glass SVG must have an `aria-label`.
  ```html
  <!-- BAD: Screen reader reads "Button" -->
  <button><svg>...</svg></button>

  <!-- GOOD: Screen reader reads "Search, Button" -->
  <button aria-label="Search"><svg aria-hidden="true">...</svg></button>
  ```

### Aria-Live Regions
When something changes on the screen dynamically (e.g., "Item added to cart", "Save successful" toast notification) without a page reload, visually impaired users won't know unless announced.
```html
<div aria-live="polite" role="status">
  <!-- When text is injected here via JS, the screen reader announces it immediately -->
  User profile updated successfully.
</div>
```

## 4. Contrast Ratios

Color contrast is a legal requirement (WCAG AA). This ensures text is readable for users with visual impairments or people reading their phones outside in the sun.

- **Normal Text (under 18pt):** Requires a contrast ratio of at least **4.5:1** against its background.
- **Large Text (over 18pt or bold over 14pt):** Requires a contrast ratio of at least **3.0:1**.
- **UI Components & Graphics:** (e.g., chart bars, icons) Require a **3.0:1** contrast ratio.

*Tip: Light gray text (`#999`) on a white background almost always fails WCAG validation. Use a darker gray (`#555` or `#666`).*
