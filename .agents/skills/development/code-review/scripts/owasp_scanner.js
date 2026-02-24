#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const targetPath = process.argv[2] || '.';
const outputJson = process.argv.includes('--json');

const codeExtensions = new Set(['.js', '.jsx', '.ts', '.tsx', '.py', '.php', '.java', '.cs', '.rb', '.go']);

const rules = [
    {
        id: 'A03-injection-sql-template',
        severity: 'HIGH',
        regex: /(?:query|execute)\s*\(\s*`[^`]*\$\{[^`]+/g,
        message: 'Potential SQL injection via template interpolation.'
    },
    {
        id: 'A03-command-injection-exec',
        severity: 'HIGH',
        regex: /\b(?:exec|system|popen)\s*\(\s*[^)]*\+/g,
        message: 'Potential command injection via string concatenation.'
    },
    {
        id: 'A03-xss-dangerous-inner-html',
        severity: 'MED',
        regex: /dangerouslySetInnerHTML\s*=\s*\{\s*\{[^}]+\}\s*\}/g,
        message: 'dangerouslySetInnerHTML detected. Ensure strict sanitization.'
    },
    {
        id: 'A07-hardcoded-secret',
        severity: 'MED',
        regex: /\b(?:jwt|token|secret|api[_-]?key)\b[^\n]{0,30}[:=][^\n]{0,10}['"][^'"]{8,}['"]/gi,
        message: 'Potential hardcoded secret.'
    },
    {
        id: 'A03-eval-usage',
        severity: 'MED',
        regex: /\beval\s*\(/g,
        message: 'eval() usage detected.'
    }
];

function walk(dir) {
    const out = [];
    if (!fs.existsSync(dir)) return out;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name === '.git') continue;
            out.push(...walk(fullPath));
        } else if (codeExtensions.has(path.extname(entry.name).toLowerCase())) {
            out.push(fullPath);
        }
    }
    return out;
}

function scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const findings = [];
    for (const rule of rules) {
        let match;
        const regex = new RegExp(rule.regex.source, rule.regex.flags);
        while ((match = regex.exec(content)) !== null) {
            const before = content.slice(0, match.index);
            const line = before.split('\n').length;
            findings.push({
                file: filePath,
                line,
                severity: rule.severity,
                rule: rule.id,
                message: rule.message,
                snippet: match[0].slice(0, 140)
            });
        }
    }
    return findings;
}

function printTextReport(results) {
    console.log('🛡️ OWASP Vulnerability Static Scanner');
    console.log(`Scanned files: ${results.scannedFiles}`);
    console.log(`Findings: ${results.findings.length}`);

    if (results.findings.length === 0) {
        console.log('✅ No findings.');
        return;
    }

    const severityOrder = { HIGH: 1, MED: 2, LOW: 3 };
    const sorted = [...results.findings].sort((a, b) => {
        return severityOrder[a.severity] - severityOrder[b.severity];
    });

    for (const finding of sorted) {
        console.log(`\n[${finding.severity}] ${finding.rule}`);
        console.log(`File: ${finding.file}:${finding.line}`);
        console.log(`Message: ${finding.message}`);
        console.log(`Match: ${finding.snippet}`);
    }
}

function main() {
    const resolvedTarget = path.resolve(process.cwd(), targetPath);
    if (!fs.existsSync(resolvedTarget)) {
        console.error(`Target path does not exist: ${resolvedTarget}`);
        process.exit(1);
    }

    const files = fs.statSync(resolvedTarget).isDirectory()
        ? walk(resolvedTarget)
        : [resolvedTarget];

    const findings = [];
    for (const filePath of files) {
        findings.push(...scanFile(filePath));
    }

    const results = {
        target: resolvedTarget,
        scannedFiles: files.length,
        findings
    };

    if (outputJson) {
        console.log(JSON.stringify(results, null, 2));
        return;
    }

    printTextReport(results);
}

main();
