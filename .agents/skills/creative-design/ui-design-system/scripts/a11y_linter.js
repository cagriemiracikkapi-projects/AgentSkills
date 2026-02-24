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

function lintFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const findings = [];

    const imgRegex = /<img\b(?![^>]*\balt=)[^>]*>/gi;
    const buttonRegex = /<button\b[^>]*>\s*<\/button>/gi;
    const tabindexRegex = /tabindex\s*=\s*["']?[1-9]["']?/gi;

    for (const regex of [imgRegex, buttonRegex, tabindexRegex]) {
        let match;
        while ((match = regex.exec(content)) !== null) {
            const line = lineOf(content, match.index);
            let message = 'Accessibility issue.';
            if (regex === imgRegex) message = 'Image element missing alt attribute.';
            if (regex === buttonRegex) message = 'Button has no accessible text content.';
            if (regex === tabindexRegex) message = 'Positive tabindex detected; avoid custom tab order.';
            findings.push({ file: filePath, line, message, snippet: match[0] });
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
        console.log(` - ${finding.file}:${finding.line} ${finding.message}`);
    }

    if (findings.length === 0) {
        console.log('✅ No issues detected.');
    }
}

main();
