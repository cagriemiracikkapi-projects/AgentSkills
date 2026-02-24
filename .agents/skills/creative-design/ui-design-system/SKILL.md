---
name: creative-design/ui-design-system
description: Complete toolkit for architecting component libraries, defining typography scales, and building robust design tokens. Use this skill when founding a new project's UI, refactoring disorganized CSS, or ensuring WCAG accessibility compliance across interfaces.
---

# Skill: UI Design System

Comprehensive architectural guidelines and tools for establishing scalable, accessible, and themeable User Interfaces.

## Quick Start

### Main Capabilities

This skill provides three core capabilities through automated scripts:

```bash
# Script 1: Design Token Generator
node .agent_scripts/creative-design_ui-design-system/token_generator.js [options]

# Script 2: Component Scaffolder
node .agent_scripts/creative-design_ui-design-system/component_scaffolder.js [options]

# Script 3: Accessibility (a11y) Linter
node .agent_scripts/creative-design_ui-design-system/a11y_linter.js [options]
```

## Core Capabilities

### 1. Design Token Generator

Converts raw color codes and font sizes into a standardized CSS Custom Properties (Variables) file, ensuring consistency across the application.

**Features:**
- Generates light and dark mode mappings automatically
- Converts hex codes to HSL for easy opacity manipulation
- Outputs Tailwind configs or raw CSS

**Usage:**
```bash
node .agent_scripts/creative-design_ui-design-system/token_generator.js --brand-color #3B82F6 --output tokens.css
```

### 2. Component Scaffolder

Automated tool to generate a new UI building block (Button, Card, Modal) complete with its logic, styling, and Storybook documentation.

**Features:**
- Includes base component file (React/Vue/Svelte)
- Generates `Component.module.css` or Tailwind classes
- Includes `Component.test.tsx` and `Component.stories.tsx`

**Usage:**
```bash
node .agent_scripts/creative-design_ui-design-system/component_scaffolder.js Button --framework react --style tailwind
```

### 3. Accessibility Linter

Scans component source code for common WCAG violations before they reach the browser.

**Features:**
- Checks for missing `aria-labels` on interactive SVGs
- Validates minimum contrast ratios in CSS declarations
- Warns about poor focus-trapping in modals

**Usage:**
```bash
node .agent_scripts/creative-design_ui-design-system/a11y_linter.js ./src/components/
```

## Reference Documentation

### Core Design Foundations

Comprehensive guide available in `references/design_foundations.md`:

- The 8-Point Grids and Spacing scales
- Modular Typography scaling (Major Third, Perfect Fourth)
- The anatomy of a semantic color palette

### Interaction & Accessibility

Technical reference guide in `references/interaction_and_a11y.md`:

- Managing Focus (Focus rings, Focus trapping)
- Defining predictable hover, active, and disabled states
- Structuring semantic HTML (Nav, Main, Article) for screen readers

## Tech Stack

**Tools:** Figma, Storybook
**Frameworks:** React, Next.js, Vue, Nuxt
**Styling:** TailwindCSS, CSS Modules, Styled-Components, Vanilla CSS
**Methodologies:** Atomic Design, BEM (Block Element Modifier)

## Development Workflow

### 1. Define Tokens
Never hardcode a pixel value or a hex color in a component.
- Run `.agent_scripts/creative-design_ui-design-system/token_generator.js` to establish your base `--color-primary-500` and `--spacing-4`.

### 2. Build Atoms
Use `.agent_scripts/creative-design_ui-design-system/component_scaffolder.js` to create the simplest elements first: `Button`, `Input`, `Typography`.

### 3. Compose and Validate
Combine Atoms into Molecules (e.g., a `SearchForm`).
- Run `.agent_scripts/creative-design_ui-design-system/a11y_linter.js` to ensure the new SearchForm can be read by a screen reader.

## Best Practices Summary

### Consistency
- Use the 8-point system strictly: 8px, 16px, 24px, 32px. Do not use 15px or 17px.
- Fonts should be scaled using `rem` based on the root font size, never static `px`.

### Accessibility (WCAG AA)
- Contrast ratio between text and its background must be at least 4.5:1.
- Never use color alone to convey meaning (e.g., error fields must have an icon or text note, not just a red border).

## Troubleshooting

### Layouts Breaking
- Verify you are building "Mobile First." Write CSS for the narrowest screen first, then use `min-width` queries to scale up.
- Avoid fixed widths (`width: 500px`). Use `max-width` and percentages (`width: 100%; max-width: 500px;`) to preserve responsiveness.

## Resources

- Design Foundations: `references/design_foundations.md`
- Accessibility Guidelines: `references/interaction_and_a11y.md`
- Utilities: `.agent_scripts/creative-design_ui-design-system/` directory
