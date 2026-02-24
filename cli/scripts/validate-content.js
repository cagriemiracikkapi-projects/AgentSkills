#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const agentsRoot = path.join(repoRoot, '.agents');
const skillsRoot = path.join(agentsRoot, 'skills');
const agentsDir = path.join(agentsRoot, 'agents');
const workflowsDir = path.join(agentsRoot, 'workflows');

function walk(dir, filterFn) {
    if (!fs.existsSync(dir)) return [];
    const out = [];
    const stack = [dir];
    while (stack.length > 0) {
        const current = stack.pop();
        const entries = fs.readdirSync(current, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(current, entry.name);
            if (entry.isDirectory()) {
                stack.push(fullPath);
            } else if (filterFn(fullPath)) {
                out.push(fullPath);
            }
        }
    }
    return out;
}

function parseAgentSkills(content) {
    const skills = [];
    const lines = content.split('\n');
    let inFrontmatter = false;
    let inSkills = false;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (i === 0 && line.trim() === '---') {
            inFrontmatter = true;
            continue;
        }
        if (inFrontmatter && line.trim() === '---') {
            break;
        }
        if (inFrontmatter && line.startsWith('skills:')) {
            inSkills = true;
            continue;
        }
        if (inSkills) {
            const trimmed = line.trimEnd();
            const left = trimmed.trimStart();
            const indent = trimmed.length - left.length;
            if (trimmed.startsWith('-')) {
                skills.push(trimmed.slice(1).trim());
            } else if (indent >= 2 && left.startsWith('-')) {
                skills.push(left.slice(1).trim());
            } else if (left !== '') {
                inSkills = false;
            }
        }
    }
    return skills;
}

function main() {
    const errors = [];
    const skillFiles = walk(skillsRoot, (file) => path.basename(file) === 'SKILL.md');
    const agentFiles = walk(agentsDir, (file) => file.endsWith('.md'));
    const workflowFiles = walk(workflowsDir, (file) => file.endsWith('.md'));

    for (const skillFile of skillFiles) {
        const content = fs.readFileSync(skillFile, 'utf8');
        const rel = path.relative(repoRoot, skillFile).replace(/\\/g, '/');
        const scriptRefs = content.match(/scripts\/[A-Za-z0-9._-]+\.(js|py)/g) || [];
        const docRefs = content.match(/references\/[A-Za-z0-9._-]+\.md/g) || [];
        for (const ref of [...scriptRefs, ...docRefs]) {
            const target = path.join(path.dirname(skillFile), ref);
            if (!fs.existsSync(target)) {
                errors.push(`[Missing ref] ${rel} -> ${ref}`);
            }
        }
    }

    for (const agentFile of agentFiles) {
        const content = fs.readFileSync(agentFile, 'utf8');
        const rel = path.relative(repoRoot, agentFile).replace(/\\/g, '/');
        const skills = parseAgentSkills(content);
        for (const skill of skills) {
            const skillPath = path.join(skillsRoot, skill, 'SKILL.md');
            if (!fs.existsSync(skillPath)) {
                errors.push(`[Missing skill] ${rel} -> ${skill}`);
            }
        }
    }

    const workflowRoleRegex = /\.agents\/agents\/([A-Za-z0-9._-]+)\.md/g;
    for (const workflowFile of workflowFiles) {
        const content = fs.readFileSync(workflowFile, 'utf8');
        const rel = path.relative(repoRoot, workflowFile).replace(/\\/g, '/');
        let match;
        while ((match = workflowRoleRegex.exec(content)) !== null) {
            const roleFile = path.join(agentsDir, `${match[1]}.md`);
            if (!fs.existsSync(roleFile)) {
                errors.push(`[Missing workflow role] ${rel} -> .agents/agents/${match[1]}.md`);
            }
        }
    }

    if (errors.length > 0) {
        console.error('Content validation failed:\n');
        for (const error of errors) {
            console.error(` - ${error}`);
        }
        process.exit(1);
    }

    console.log('Content validation passed.');
}

main();
