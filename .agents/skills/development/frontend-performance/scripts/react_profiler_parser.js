#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const SLOW_RENDER_MS = 16; // 1 frame at 60fps
const TOP_N = 10;

function loadProfilerJson(filePath) {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    // React DevTools profiler format has a root array or object with commitData
    if (Array.isArray(raw)) return raw;
    if (raw.commitData) return [raw];
    // React DevTools export wraps in { version, dataForRoots: [...] }
    if (raw.dataForRoots) {
        return raw.dataForRoots.flatMap(root => root.commitData || []);
    }
    return [];
}

function aggregateComponents(commits) {
    const stats = new Map(); // componentName → { totalDuration, renderCount, slowRenders, reasons }

    for (const commit of commits) {
        const changeDescs = commit.changeDescriptions || {};
        const fiberData = commit.fiberActualDurations || commit.actualDurations || {};

        for (const [fiberId, duration] of Object.entries(fiberData)) {
            const name = (commit.fiberNames && commit.fiberNames[fiberId])
                || (commit.displayName)
                || `Fiber#${fiberId}`;
            if (!stats.has(name)) {
                stats.set(name, { totalDuration: 0, renderCount: 0, slowRenders: 0, reasons: [] });
            }
            const entry = stats.get(name);
            entry.totalDuration += duration;
            entry.renderCount += 1;
            if (duration > SLOW_RENDER_MS) {
                entry.slowRenders += 1;
                // Pull change description if available
                const desc = changeDescs[fiberId];
                if (desc && entry.reasons.length < 5) {
                    if (desc.isFirstMount) entry.reasons.push('first mount');
                    if (desc.didHooksChange) entry.reasons.push('hooks changed');
                    if (desc.props) entry.reasons.push(`props changed: ${Object.keys(desc.props).slice(0, 3).join(', ')}`);
                    if (desc.state) entry.reasons.push(`state changed: ${Object.keys(desc.state).slice(0, 3).join(', ')}`);
                }
            }
        }

        // Flat commitData format (React DevTools ≥ 4.x)
        if (commit.commitDuration && commit.rootDisplayName) {
            const name = commit.rootDisplayName;
            if (!stats.has(name)) {
                stats.set(name, { totalDuration: 0, renderCount: 0, slowRenders: 0, reasons: [] });
            }
            const entry = stats.get(name);
            entry.totalDuration += commit.commitDuration;
            entry.renderCount += 1;
            if (commit.commitDuration > SLOW_RENDER_MS) {
                entry.slowRenders += 1;
            }
        }
    }

    return stats;
}

function main() {
    const profilePath = args[0];

    if (!profilePath) {
        console.log('⚛️  React Profiler Trace Parser');
        console.log('\nUsage:');
        console.log('  node react_profiler_parser.js <profiler.json>');
        console.log('\nExport profiler data from React DevTools → "Save profile" button.');
        process.exit(1);
    }

    const resolved = path.resolve(process.cwd(), profilePath);
    if (!fs.existsSync(resolved)) {
        console.error(`Profiler file not found: ${resolved}`);
        process.exit(1);
    }

    console.log('⚛️  React Profiler Trace Parser');
    console.log(`File: ${resolved}\n`);

    let commits;
    try {
        commits = loadProfilerJson(resolved);
    } catch (err) {
        console.error(`Failed to parse profiler JSON: ${err.message}`);
        process.exit(1);
    }

    if (commits.length === 0) {
        console.log('No commit data found in profiler file.');
        console.log('Ensure you exported the profile from React DevTools (not a browser trace).');
        process.exit(1);
    }

    console.log(`Commits analyzed: ${commits.length}`);

    const stats = aggregateComponents(commits);

    if (stats.size === 0) {
        console.log('\nNo fiber/component data found. Verify the file is a React DevTools profile export.');
        process.exit(0);
    }

    // Sort by total render duration descending
    const sorted = [...stats.entries()]
        .sort(([, a], [, b]) => b.totalDuration - a.totalDuration)
        .slice(0, TOP_N);

    const totalSlowRenders = [...stats.values()].reduce((s, v) => s + v.slowRenders, 0);
    console.log(`Components tracked: ${stats.size}`);
    console.log(`Slow renders (>${SLOW_RENDER_MS}ms): ${totalSlowRenders}\n`);

    console.log(`🔥 Top ${Math.min(TOP_N, sorted.length)} hot components (by total render time):`);
    for (const [name, data] of sorted) {
        const avgMs = data.renderCount > 0 ? (data.totalDuration / data.renderCount).toFixed(1) : '0.0';
        const slowTag = data.slowRenders > 0 ? ` [${data.slowRenders} slow renders]` : '';
        console.log(`  <${name}>`);
        console.log(`    total: ${data.totalDuration.toFixed(1)}ms  renders: ${data.renderCount}  avg: ${avgMs}ms${slowTag}`);
        if (data.reasons.length > 0) {
            const unique = [...new Set(data.reasons)];
            console.log(`    reasons: ${unique.join(' | ')}`);
        }
    }

    // Optimization suggestions
    console.log('\n💡 Recommendations:');
    for (const [name, data] of sorted) {
        if (data.slowRenders > 3) {
            console.log(`  - Wrap <${name}> in React.memo() if props are stable.`);
        }
        if (data.renderCount > 20 && data.reasons.some(r => r.includes('state'))) {
            console.log(`  - <${name}> re-renders frequently due to state. Consider useCallback/useMemo or context splitting.`);
        }
    }
}

main();
