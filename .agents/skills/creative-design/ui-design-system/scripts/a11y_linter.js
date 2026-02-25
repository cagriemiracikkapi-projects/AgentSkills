#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const target = process.argv[2] || '.';
const extensions = new Set(['.js', '.jsx', '.ts', '.tsx', '.html', '.vue', '.svelte']);

function walk(dir) {
    const out = [];
    if (!fs.existsSync(dir)) return out;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name === '.git') continue;
            out.push(...walk(fullPath));
        } else if (extensions.has(path.extname(entry.name).toLowerCase())) {
            out.push(fullPath);
        }
    }
    return out;
}

function lineOf(content, index) {
    return content.slice(0, index).split('\n').length;
}

const RULES = [
    {
        id: 'img-missing-alt',
        wcag: 'WCAG 1.1.1 (A)',
        regex: /<img\b(?![^>]*\balt=)[^>]*>/gi,
        message: 'Image element missing alt attribute.',
    },
    {
        id: 'button-empty',
        wcag: 'WCAG 4.1.2 (A)',
        regex: /<button\b[^>]*>\s*<\/button>/gi,
        message: 'Button has no accessible text content.',
    },
    {
        id: 'positive-tabindex',
        wcag: 'WCAG 2.4.3 (A)',
        regex: /tabindex\s*=\s*["']?[1-9]["']?/gi,
        message: 'Positive tabindex detected; avoid custom tab order.',
    },
    {
        id: 'aria-label-empty',
        wcag: 'WCAG 4.1.2 (A)',
        regex: /aria-label\s*=\s*["']\s*["']/gi,
        message: 'aria-label is present but empty — provide descriptive text.',
    },
    {
        id: 'div-button-no-keyboard',
        wcag: 'WCAG 2.1.1 (A)',
        regex: /role\s*=\s*["']button["'][^>]*>(?![^<]*(?:onKeyDown|onKeyPress|onKeyUp|tabIndex|tabindex))/gi,
        message: 'role="button" on non-button element without keyboard handler (onKeyDown/onKeyPress).',
    },
];

function lintFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const findings = [];

    for (const rule of RULES) {
        let match;
        const regex = new RegExp(rule.regex.source, rule.regex.flags);
        while ((match = regex.exec(content)) !== null) {
            const line = lineOf(content, match.index);
            findings.push({
                file: filePath,
                line,
                id: rule.id,
                wcag: rule.wcag,
                message: rule.message,
                snippet: match[0].slice(0, 120),
            });
        }
    }

    return findings;
}

function main() {
    const resolved = path.resolve(process.cwd(), target);
    if (!fs.existsSync(resolved)) {
        console.error(`Target path does not exist: ${resolved}`);
        process.exit(1);
    }

    const files = fs.statSync(resolved).isDirectory() ? walk(resolved) : [resolved];
    const findings = files.flatMap(lintFile);

    console.log('♿ Accessibility Linter');
    console.log(`Scanned files: ${files.length}`);
    console.log(`Findings: ${findings.length}`);

    for (const finding of findings) {
        console.log(` - ${finding.file}:${finding.line}  [${finding.wcag}]  ${finding.message}`);
        if (finding.snippet) console.log(`     ${finding.snippet}`);
    }

    if (findings.length === 0) {
        console.log('✅ No issues detected.');
    }
}

main();
