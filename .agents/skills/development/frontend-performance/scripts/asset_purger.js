#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const IMAGE_SIZE_WARN = 200 * 1024; // 200 KB

const SRC_EXTENSIONS = new Set(['.jsx', '.tsx', '.html', '.js', '.ts', '.vue', '.svelte']);
const CSS_EXTENSIONS = new Set(['.css', '.scss', '.sass', '.less']);
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.webp', '.avif']);

function walk(dir, extSet) {
    const out = [];
    if (!fs.existsSync(dir)) return out;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name === '.git') continue;
            out.push(...walk(full, extSet));
        } else if (extSet.has(path.extname(entry.name).toLowerCase())) {
            out.push(full);
        }
    }
    return out;
}

function extractUsedClasses(srcDir) {
    const classes = new Set();
    const files = walk(srcDir, SRC_EXTENSIONS);
    const classAttrRe = /class(?:Name)?\s*=\s*["'`]([^"'`]+)["'`]/g;
    const stylesDotRe = /styles\.(\w+)/g;

    for (const filePath of files) {
        const content = fs.readFileSync(filePath, 'utf8');
        let m;
        const re1 = new RegExp(classAttrRe.source, classAttrRe.flags);
        while ((m = re1.exec(content)) !== null) {
            m[1].split(/\s+/).forEach(cls => cls && classes.add(cls));
        }
        const re2 = new RegExp(stylesDotRe.source, stylesDotRe.flags);
        while ((m = re2.exec(content)) !== null) {
            classes.add(m[1]);
        }
    }
    return classes;
}

function extractDefinedSelectors(cssDir) {
    const selectors = new Map(); // selector name → "file:line"
    const files = walk(cssDir, CSS_EXTENSIONS);
    const selectorRe = /\.([a-zA-Z][\w-]*)\s*(?:[,{:[])/g;

    for (const filePath of files) {
        const content = fs.readFileSync(filePath, 'utf8');
        let m;
        const re = new RegExp(selectorRe.source, selectorRe.flags);
        while ((m = re.exec(content)) !== null) {
            const lineNo = content.slice(0, m.index).split('\n').length;
            if (!selectors.has(m[1])) {
                selectors.set(m[1], `${filePath}:${lineNo}`);
            }
        }
    }
    return selectors;
}

function findLargeImages(rootDir) {
    const imageFiles = walk(rootDir, IMAGE_EXTENSIONS);
    return imageFiles
        .map(img => ({ path: img, size: fs.statSync(img).size }))
        .filter(img => img.size > IMAGE_SIZE_WARN)
        .sort((a, b) => b.size - a.size);
}

function humanBytes(bytes) {
    if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
    if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(1)} KB`;
    return `${bytes} B`;
}

function main() {
    console.log('🧹 Asset Purger');

    const srcIdx = args.indexOf('--src');
    const cssIdx = args.indexOf('--css');

    const srcDir = srcIdx !== -1 && args[srcIdx + 1]
        ? path.resolve(process.cwd(), args[srcIdx + 1])
        : path.resolve(process.cwd(), 'src');
    const cssDir = cssIdx !== -1 && args[cssIdx + 1]
        ? path.resolve(process.cwd(), args[cssIdx + 1])
        : srcDir;

    if (!fs.existsSync(srcDir)) {
        console.error(`Source directory not found: ${srcDir}`);
        console.log('\nUsage:');
        console.log('  node asset_purger.js --src src/ [--css src/styles/]');
        process.exit(1);
    }

    console.log(`Source: ${srcDir}`);
    console.log(`CSS:    ${cssDir}\n`);

    const usedClasses = extractUsedClasses(srcDir);
    console.log(`Used class names found in source: ${usedClasses.size}`);

    const definedSelectors = extractDefinedSelectors(cssDir);
    console.log(`CSS selectors defined: ${definedSelectors.size}`);

    const unused = [];
    for (const [selector, location] of definedSelectors.entries()) {
        if (!usedClasses.has(selector)) {
            unused.push({ selector, location });
        }
    }

    if (unused.length > 0) {
        console.log(`\n🗑️  Unused CSS selectors (${unused.length}):`);
        for (const item of unused.slice(0, 30)) {
            console.log(`   .${item.selector}  →  ${item.location}`);
        }
        if (unused.length > 30) console.log(`   ... and ${unused.length - 30} more`);
    } else {
        console.log('\n✅ No unused CSS selectors detected.');
    }

    const largeImages = findLargeImages(srcDir);
    if (largeImages.length > 0) {
        console.log(`\n🖼️  Large images (>${humanBytes(IMAGE_SIZE_WARN)}):`);
        for (const img of largeImages) {
            const impact = img.size > 1_000_000 ? '  ← critical LCP impact' : '';
            console.log(`   ${humanBytes(img.size).padEnd(10)} ${img.path}${impact}`);
        }
        console.log('   Compress to WebP/AVIF and use responsive srcset.');
    } else {
        console.log('\n✅ No oversized images detected.');
    }

    console.log(`\nTotal issues: ${unused.length + largeImages.length}`);
}

main();
