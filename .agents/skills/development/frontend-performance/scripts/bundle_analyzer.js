#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

const HEAVY_DEPS = [
    { name: 'moment', threshold: 60_000, suggestion: 'Replace with date-fns or dayjs (tree-shakeable).' },
    { name: 'lodash', threshold: 50_000, suggestion: 'Use lodash-es or per-method imports (e.g., lodash/debounce).' },
    { name: 'jquery', threshold: 30_000, suggestion: 'Consider native DOM APIs.' },
    { name: 'rxjs', threshold: 100_000, suggestion: 'Ensure only used operators are imported.' },
    { name: 'antd', threshold: 200_000, suggestion: 'Enable tree-shaking / babel-plugin-import.' },
    { name: '@mui', threshold: 150_000, suggestion: 'Use named path imports (e.g., @mui/material/Button).' },
];

const CHUNK_WARN_BYTES = 250_000;
const VENDOR_WARN_BYTES = 1_000_000;

function humanBytes(bytes) {
    if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
    if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(1)} KB`;
    return `${bytes} B`;
}

function parseStatsJson(statsPath) {
    const raw = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
    const modules = [];
    if (raw.modules) {
        for (const mod of raw.modules) {
            modules.push({ name: mod.name || mod.identifier || '<unknown>', size: mod.size || 0 });
        }
    }
    if (raw.output) {
        for (const [, chunk] of Object.entries(raw.output)) {
            if (chunk.modules) {
                for (const [modName, mod] of Object.entries(chunk.modules)) {
                    modules.push({ name: modName, size: mod.renderedLength || mod.originalLength || 0 });
                }
            }
        }
    }
    return modules.sort((a, b) => b.size - a.size);
}

function scanDistFolder(distPath) {
    const results = [];
    if (!fs.existsSync(distPath)) return results;
    function walk(dir) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) { walk(full); }
            else if (entry.name.endsWith('.js') || entry.name.endsWith('.mjs')) {
                const stat = fs.statSync(full);
                results.push({ name: path.relative(distPath, full), size: stat.size });
            }
        }
    }
    walk(distPath);
    return results.sort((a, b) => b.size - a.size);
}

function detectHeavyDeps(modules) {
    const alerts = [];
    for (const dep of HEAVY_DEPS) {
        const matching = modules.filter(m => m.name && m.name.includes(dep.name));
        const totalSize = matching.reduce((s, m) => s + m.size, 0);
        if (totalSize > dep.threshold) {
            alerts.push({ dep: dep.name, size: totalSize, suggestion: dep.suggestion });
        }
    }
    return alerts;
}

function main() {
    console.log('📦 Bundle Size Analyzer');

    const statsIdx = args.indexOf('--stats');
    const srcIdx = args.indexOf('--src');
    let modules = [];

    if (statsIdx !== -1 && args[statsIdx + 1]) {
        const statsFile = path.resolve(process.cwd(), args[statsIdx + 1]);
        if (!fs.existsSync(statsFile)) {
            console.error(`Stats file not found: ${statsFile}`);
            process.exit(1);
        }
        console.log(`Parsing webpack/vite stats: ${statsFile}\n`);
        modules = parseStatsJson(statsFile);
    } else {
        const distPath = srcIdx !== -1 && args[srcIdx + 1]
            ? path.resolve(process.cwd(), args[srcIdx + 1])
            : path.resolve(process.cwd(), 'dist');
        console.log(`Scanning dist folder: ${distPath}\n`);
        modules = scanDistFolder(distPath);
    }

    if (modules.length === 0) {
        console.log('No JS modules found. Run a build first or provide --stats <stats.json>.');
        console.log('\nUsage:');
        console.log('  node bundle_analyzer.js --stats dist/stats.json');
        console.log('  node bundle_analyzer.js --src dist/');
        return;
    }

    console.log('Top 10 largest modules:');
    for (const mod of modules.slice(0, 10)) {
        const warn = mod.size > CHUNK_WARN_BYTES ? ' ⚠️' : '';
        console.log(`  ${humanBytes(mod.size).padEnd(10)} ${mod.name}${warn}`);
    }

    const total = modules.reduce((s, m) => s + m.size, 0);
    console.log(`\nTotal analyzed size: ${humanBytes(total)}`);

    const vendorMods = modules.filter(m => m.name && (m.name.includes('vendor') || m.name.includes('node_modules')));
    const vendorSize = vendorMods.reduce((s, m) => s + m.size, 0);
    if (vendorSize > VENDOR_WARN_BYTES) {
        console.log(`\n⚠️  Vendor bundle is ${humanBytes(vendorSize)} — consider route-level code splitting (React.lazy / dynamic import).`);
    }

    const alerts = detectHeavyDeps(modules);
    if (alerts.length > 0) {
        console.log('\n🚨 Heavy dependency alerts:');
        for (const alert of alerts) {
            console.log(`  [${humanBytes(alert.size)}] ${alert.dep} — ${alert.suggestion}`);
        }
    } else {
        console.log('\n✅ No heavy dependency alerts.');
    }
}

main();
