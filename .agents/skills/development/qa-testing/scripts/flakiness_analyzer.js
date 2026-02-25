#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const FLAKY_FAIL_RATE = 0.20; // >20% fail without recent change = flaky

const LOG_EXTENSIONS = new Set(['.log', '.txt', '.json']);
const SRC_EXTENSIONS = new Set(['.js', '.ts', '.jsx', '.tsx', '.spec.js', '.spec.ts', '.test.js', '.test.ts']);

// Patterns for test result lines in CI logs
const PASS_RE = /(?:PASS|✓|✔|passed|ok)\s+(.+?)(?:\s+\(\d+ms\))?$/i;
const FAIL_RE = /(?:FAIL|✕|✗|failed|not ok)\s+(.+?)(?:\s+\(\d+ms\))?$/i;
// Jest/Mocha structured JSON
const JEST_JSON_SUITE_RE = /"testFilePath":\s*"([^"]+)"/;

// Pattern for hardcoded waits in test files
const SLEEP_RE = /(?:setTimeout|sleep|cy\.wait|waitFor)\s*\(\s*(\d+)/g;
const HARDCODED_WAIT_THRESHOLD_MS = 1000;

function walk(dir) {
    const out = [];
    if (!fs.existsSync(dir)) return out;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name === '.git') continue;
            out.push(...walk(full));
        } else {
            out.push(full);
        }
    }
    return out;
}

function parseLogFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const content = fs.readFileSync(filePath, 'utf8');
    const results = []; // { testName, passed }

    if (ext === '.json') {
        try {
            const data = JSON.parse(content);
            // Jest JSON reporter format
            if (data.testResults) {
                for (const suite of data.testResults) {
                    for (const test of suite.testResults || []) {
                        results.push({
                            testName: `${suite.testFilePath} > ${test.fullName}`,
                            passed: test.status === 'passed',
                        });
                    }
                }
            }
            return results;
        } catch (_) { /* fall through to line-based parse */ }
    }

    for (const line of content.split('\n')) {
        let m = PASS_RE.exec(line);
        if (m) { results.push({ testName: m[1].trim(), passed: true }); continue; }
        m = FAIL_RE.exec(line);
        if (m) { results.push({ testName: m[1].trim(), passed: false }); }
    }

    return results;
}

function analyzeFlakiness(logsDir) {
    const allFiles = walk(logsDir).filter(f => LOG_EXTENSIONS.has(path.extname(f).toLowerCase()));
    if (allFiles.length === 0) {
        return { logFiles: 0, tests: {} };
    }

    const tests = {}; // testName → { pass, fail }

    for (const logFile of allFiles) {
        const results = parseLogFile(logFile);
        for (const r of results) {
            if (!tests[r.testName]) tests[r.testName] = { pass: 0, fail: 0 };
            if (r.passed) tests[r.testName].pass++;
            else tests[r.testName].fail++;
        }
    }

    return { logFiles: allFiles.length, tests };
}

function detectHardcodedWaits(srcDir) {
    const findings = [];
    if (!fs.existsSync(srcDir)) return findings;

    const files = walk(srcDir).filter(f => {
        const base = path.basename(f);
        return base.includes('.spec.') || base.includes('.test.') || base.includes('.cy.');
    });

    for (const filePath of files) {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        let m;
        const re = new RegExp(SLEEP_RE.source, SLEEP_RE.flags);
        while ((m = re.exec(content)) !== null) {
            const ms = parseInt(m[1], 10);
            if (ms >= HARDCODED_WAIT_THRESHOLD_MS) {
                const lineNo = content.slice(0, m.index).split('\n').length;
                findings.push({
                    file: filePath,
                    line: lineNo,
                    ms,
                    snippet: lines[lineNo - 1].trim().slice(0, 100),
                });
            }
        }
    }
    return findings;
}

function main() {
    const logsIdx = args.indexOf('--logs');
    const srcIdx = args.indexOf('--src');

    const logsDir = logsIdx !== -1 && args[logsIdx + 1]
        ? path.resolve(process.cwd(), args[logsIdx + 1])
        : null;
    const srcDir = srcIdx !== -1 && args[srcIdx + 1]
        ? path.resolve(process.cwd(), args[srcIdx + 1])
        : path.resolve(process.cwd(), '.');

    console.log('🔍 CI Log Flakiness Analyzer');

    let flaky = [];

    if (logsDir) {
        if (!fs.existsSync(logsDir)) {
            console.error(`Logs directory not found: ${logsDir}`);
            process.exit(1);
        }
        console.log(`Logs: ${logsDir}`);

        const { logFiles, tests } = analyzeFlakiness(logsDir);
        console.log(`Log files parsed: ${logFiles}`);
        console.log(`Unique tests tracked: ${Object.keys(tests).length}\n`);

        for (const [testName, counts] of Object.entries(tests)) {
            const total = counts.pass + counts.fail;
            if (total < 2) continue;
            const failRate = counts.fail / total;
            if (failRate > FLAKY_FAIL_RATE && failRate < 1.0) {
                flaky.push({ testName, failRate, counts });
            }
        }

        if (flaky.length > 0) {
            console.log(`⚠️  Flaky tests detected (>${Math.round(FLAKY_FAIL_RATE * 100)}% fail rate):`);
            flaky.sort((a, b) => b.failRate - a.failRate);
            for (const f of flaky) {
                const pct = (f.failRate * 100).toFixed(0);
                console.log(`   [${pct}% fail] ${f.testName}`);
                console.log(`   pass: ${f.counts.pass}  fail: ${f.counts.fail}`);
            }
        } else {
            console.log('✅ No flaky tests detected from log analysis.');
        }
        console.log();
    } else {
        console.log('(No --logs dir provided — skipping log analysis)');
        console.log('Usage: node flakiness_analyzer.js --logs ci-logs/ [--src src/]\n');
    }

    // Always scan source for hardcoded waits
    console.log(`Scanning test files for hardcoded waits: ${srcDir}`);
    const waits = detectHardcodedWaits(srcDir);
    if (waits.length > 0) {
        console.log(`⚠️  Hardcoded waits (>= ${HARDCODED_WAIT_THRESHOLD_MS}ms) detected in test files:`);
        for (const w of waits) {
            console.log(`   ${w.file}:${w.line}  [${w.ms}ms]`);
            console.log(`   ${w.snippet}`);
            console.log(`   Fix: Replace with cy.get('[data-testid="..."]').should('exist') or waitFor(selector).`);
        }
    } else {
        console.log('✅ No hardcoded waits detected.');
    }

    const total = flaky.length + waits.length;
    console.log(`\nTotal issues: ${total}`);
}

main();
