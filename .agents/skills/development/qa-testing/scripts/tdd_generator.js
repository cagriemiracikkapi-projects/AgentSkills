#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

function parseArgs() {
    const result = {
        name: null,
        target: 'unit',
        typescript: false,
        out: '__tests__',
    };
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--target' && args[i + 1]) result.target = args[++i];
        else if (args[i] === '--out' && args[i + 1]) result.out = args[++i];
        else if (args[i] === '--typescript') result.typescript = true;
        else if (!args[i].startsWith('--')) result.name = args[i];
    }
    return result;
}

function toPascal(str) {
    return str.replace(/[-_\s]+(.)/g, (_, c) => c.toUpperCase())
        .replace(/^(.)/, c => c.toUpperCase());
}

function toCamel(str) {
    const p = toPascal(str);
    return p.charAt(0).toLowerCase() + p.slice(1);
}

function generateUnit(className, typescript) {
    const ext = typescript ? 'ts' : 'js';
    const instanceName = toCamel(className);
    const importExt = typescript ? '' : '';
    const typeAnnotation = typescript ? `: ${className}` : '';
    const tsImport = typescript ? `import { ${className} } from '../${className}';\n` : `const { ${className} } = require('../${className}');\n`;

    return {
        filename: `${className}.spec.${ext}`,
        content: `${tsImport}
describe('${className}', () => {
  let ${instanceName}${typeAnnotation};

  beforeEach(() => {
    ${instanceName} = new ${className}();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create an instance successfully', () => {
      expect(${instanceName}).toBeDefined();
      expect(${instanceName}).toBeInstanceOf(${className});
    });
  });

  describe('happy path', () => {
    it('should return expected result for valid input', () => {
      // Arrange
      const input = {}; // TODO: replace with real input

      // Act
      // const result = ${instanceName}.someMethod(input);

      // Assert
      // expect(result).toEqual(expectedValue);
      expect(true).toBe(true); // TODO: replace with real assertion
    });
  });

  describe('edge cases', () => {
    it('should throw when given null input', () => {
      // Arrange & Act & Assert
      expect(() => {
        // ${instanceName}.someMethod(null);
      }).not.toThrow(); // TODO: replace with real edge case
    });

    it('should handle empty input gracefully', () => {
      // Arrange
      const emptyInput = {};

      // Act & Assert
      expect(() => {
        // ${instanceName}.someMethod(emptyInput);
      }).not.toThrow(); // TODO: implement
    });
  });

  describe('error cases', () => {
    it('should reject invalid state transitions', () => {
      // TODO: implement based on ${className} domain logic
      expect(true).toBe(true);
    });
  });
});
`
    };
}

function generateIntegration(className, typescript) {
    const ext = typescript ? 'ts' : 'js';
    const instanceName = toCamel(className);

    return {
        filename: `${className}.integration.spec.${ext}`,
        content: `// Integration test for ${className}
// Tests interaction between ${className} and its real dependencies

${typescript ? `import { ${className} } from '../${className}';` : `const { ${className} } = require('../${className}');`}

describe('${className} integration', () => {
  beforeAll(async () => {
    // TODO: setup test database / external services
  });

  afterAll(async () => {
    // TODO: teardown
  });

  it('should persist and retrieve state correctly', async () => {
    // Arrange
    const ${instanceName} = new ${className}();

    // Act
    // const result = await ${instanceName}.save({ id: 'test-1' });

    // Assert
    // expect(result.id).toBe('test-1');
    expect(true).toBe(true); // TODO: implement
  });

  it('should rollback on error', async () => {
    // TODO: implement transaction rollback test
    expect(true).toBe(true);
  });
});
`
    };
}

function generateE2E(className, typescript) {
    const pageName = toPascal(className);

    return {
        filename: `${className}.e2e.spec.js`,
        content: `// E2E test for ${pageName} page/flow (Cypress)
describe('${pageName} E2E', () => {
  beforeEach(() => {
    cy.visit('/${className.toLowerCase()}');
  });

  it('loads the page without errors', () => {
    cy.get('[data-testid="${className.toLowerCase()}-container"]').should('exist');
  });

  it('completes the happy path flow', () => {
    // TODO: fill form fields, submit, assert success state
    cy.get('[data-testid="submit-btn"]').should('be.visible');
  });

  it('shows validation errors for invalid input', () => {
    cy.get('[data-testid="submit-btn"]').click();
    cy.get('[data-testid="error-message"]').should('be.visible');
  });

  it('navigates back on cancel', () => {
    cy.get('[data-testid="cancel-btn"]').click();
    cy.url().should('not.include', '/${className.toLowerCase()}');
  });
});
`
    };
}

function main() {
    const opts = parseArgs();

    if (!opts.name) {
        console.log('🧪 TDD Boilerplate Generator');
        console.log('\nUsage:');
        console.log('  node tdd_generator.js <ClassName> [--target unit|integration|e2e] [--typescript] [--out <dir>]');
        console.log('\nExamples:');
        console.log('  node tdd_generator.js UserService --target unit --typescript');
        console.log('  node tdd_generator.js OrderController --target integration');
        console.log('  node tdd_generator.js Checkout --target e2e');
        process.exit(1);
    }

    const className = toPascal(opts.name);
    const outDir = path.resolve(process.cwd(), opts.out);

    let generated;
    if (opts.target === 'unit') {
        generated = generateUnit(className, opts.typescript);
    } else if (opts.target === 'integration') {
        generated = generateIntegration(className, opts.typescript);
    } else if (opts.target === 'e2e') {
        generated = generateE2E(className, opts.typescript);
    } else {
        console.error(`Unknown target: ${opts.target}. Use unit | integration | e2e`);
        process.exit(1);
    }

    fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, generated.filename);
    fs.writeFileSync(outFile, generated.content, 'utf8');

    console.log('🧪 TDD Boilerplate Generator');
    console.log(`Class:   ${className}`);
    console.log(`Target:  ${opts.target}`);
    console.log(`Output:  ${outFile}`);
    console.log('\n✅ File written. Start implementing the TODOs and run:');
    console.log('   npx jest --watch');
}

main();
