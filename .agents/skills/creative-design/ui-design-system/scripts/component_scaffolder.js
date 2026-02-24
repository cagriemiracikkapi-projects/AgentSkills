#!/usr/bin/env node

const args = process.argv.slice(2);
console.log("🧩 UI Component Scaffolder (Mock)");

const componentName = args[0] || "UnknownComponent";
console.log(`Building framework agnostic structure for: ${componentName}`);
console.log("...");
console.log("Generated:");
console.log(` ✅ src/components/${componentName}/${componentName}.tsx (Component Logic)`);
console.log(` ✅ src/components/${componentName}/${componentName}.module.css (Encapsulated Styles)`);
console.log(` ✅ src/components/${componentName}/${componentName}.test.tsx (RTL Tests)`);
console.log(` ✅ src/components/${componentName}/${componentName}.stories.tsx (Storybook Doc)`);
console.log("✅ Component scaffolded successfully.");
