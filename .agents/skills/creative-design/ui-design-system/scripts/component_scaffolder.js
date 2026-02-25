#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

function parseArgs() {
    return {
        name: getArg('--name') || args.find(a => !a.startsWith('--')),
        out: getArg('--out', 'src/components'),
        framework: getArg('--framework', 'react'),
    };
}

function getArg(flag, def) {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : def;
}

function toPascal(str) {
    return str.replace(/[-_\s]+(.)/g, (_, c) => c.toUpperCase())
        .replace(/^(.)/, c => c.toUpperCase());
}

function toKebab(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

// ---- React templates ----

function reactComponent(name) {
    const kebab = toKebab(name);
    return `import React from 'react';
import styles from './${name}.module.css';

export interface ${name}Props {
  children?: React.ReactNode;
  className?: string;
}

export const ${name}: React.FC<${name}Props> = ({ children, className = '' }) => {
  return (
    <div className={\`\${styles.root} \${className}\`} data-testid="${kebab}">
      {children}
    </div>
  );
};

export default ${name};
`;
}

function reactCSS(name) {
    const kebab = toKebab(name);
    return `.root {
  /* ${name} base styles */
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

/* Responsive */
@media (max-width: 768px) {
  .root {
    /* mobile overrides */
  }
}
`;
}

function reactTest(name) {
    const kebab = toKebab(name);
    return `import React from 'react';
import { render, screen } from '@testing-library/react';
import { ${name} } from './${name}';

describe('${name}', () => {
  it('renders without crashing', () => {
    render(<${name} />);
    expect(screen.getByTestId('${kebab}')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(<${name}>Hello</${name}>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<${name} className="custom" />);
    expect(screen.getByTestId('${kebab}')).toHaveClass('custom');
  });
});
`;
}

function reactStory(name) {
    return `import type { Meta, StoryObj } from '@storybook/react';
import { ${name} } from './${name}';

const meta: Meta<typeof ${name}> = {
  title: 'Components/${name}',
  component: ${name},
  tags: ['autodocs'],
  argTypes: {
    className: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof ${name}>;

export const Default: Story = {
  args: {
    children: '${name} content',
  },
};

export const WithCustomClass: Story = {
  args: {
    children: '${name} content',
    className: 'custom-class',
  },
};
`;
}

// ---- Vue templates ----

function vueComponent(name) {
    const kebab = toKebab(name);
    return `<template>
  <div :class="['root', className]" data-testid="${kebab}">
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  className?: string;
}>();
</script>

<style module>
.root {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}
</style>
`;
}

// ---- Svelte templates ----

function svelteComponent(name) {
    const kebab = toKebab(name);
    return `<script lang="ts">
  export let className: string = '';
</script>

<div class="root {className}" data-testid="${kebab}">
  <slot />
</div>

<style>
  .root {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }
</style>
`;
}

function writeFile(filePath, content) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${filePath}`);
}

function main() {
    const opts = parseArgs();

    if (!opts.name) {
        console.log('🧩 UI Component Scaffolder');
        console.log('\nUsage:');
        console.log('  node component_scaffolder.js --name <ComponentName> [--out src/components] [--framework react|vue|svelte]');
        console.log('\nExamples:');
        console.log('  node component_scaffolder.js --name Button');
        console.log('  node component_scaffolder.js --name DataTable --out src/ui/components --framework react');
        console.log('  node component_scaffolder.js --name MyWidget --framework vue');
        process.exit(1);
    }

    const name = toPascal(opts.name);
    const framework = opts.framework.toLowerCase();
    const compDir = path.resolve(process.cwd(), opts.out, name);

    console.log('🧩 UI Component Scaffolder');
    console.log(`Name:      ${name}`);
    console.log(`Framework: ${framework}`);
    console.log(`Output:    ${compDir}\n`);

    if (framework === 'react') {
        writeFile(path.join(compDir, `${name}.tsx`), reactComponent(name));
        writeFile(path.join(compDir, `${name}.module.css`), reactCSS(name));
        writeFile(path.join(compDir, `${name}.test.tsx`), reactTest(name));
        writeFile(path.join(compDir, `${name}.stories.tsx`), reactStory(name));
        writeFile(path.join(compDir, 'index.ts'), `export { ${name} } from './${name}';\nexport type { ${name}Props } from './${name}';\n`);
    } else if (framework === 'vue') {
        writeFile(path.join(compDir, `${name}.vue`), vueComponent(name));
        writeFile(path.join(compDir, 'index.ts'), `export { default as ${name} } from './${name}.vue';\n`);
    } else if (framework === 'svelte') {
        writeFile(path.join(compDir, `${name}.svelte`), svelteComponent(name));
        writeFile(path.join(compDir, 'index.ts'), `export { default as ${name} } from './${name}.svelte';\n`);
    } else {
        console.error(`Unknown framework: ${framework}. Use react | vue | svelte`);
        process.exit(1);
    }

    console.log('\n✅ Component scaffolded successfully.');
}

main();
