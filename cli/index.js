#!/usr/bin/env node

const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const https = require('https');
const packageJson = require('./package.json');
const CLI_VERSION = packageJson.version;

let chalk;
let inquirer;

const LOCAL_DEV_PATH = path.resolve(__dirname, '../.agents');
const FALLBACK_SOURCE_REPO = 'cagriemiracikkapi-projects/AgentSkills';
const DEFAULT_REPO_BRANCH = 'main';

function normalizeOwnerRepo(value) {
    if (!value || typeof value !== 'string') return null;
    let candidate = value.trim();
    if (!candidate) return null;

    candidate = candidate.replace(/^git\+/, '');
    candidate = candidate.replace(/^https?:\/\/github\.com\//i, '');
    candidate = candidate.replace(/^git@github\.com:/i, '');
    candidate = candidate.replace(/\.git$/i, '');
    candidate = candidate.replace(/^\/+|\/+$/g, '');

    const parts = candidate.split('/');
    if (parts.length >= 2 && parts[0] && parts[1]) {
        return `${parts[0]}/${parts[1]}`;
    }
    return null;
}

function extractOwnerRepoFromPackage() {
    const repository = packageJson.repository;
    if (!repository) return null;
    if (typeof repository === 'string') return normalizeOwnerRepo(repository);
    if (typeof repository === 'object' && repository.url) {
        return normalizeOwnerRepo(repository.url);
    }
    return null;
}

const DEFAULT_SOURCE_REPO = extractOwnerRepoFromPackage() || FALLBACK_SOURCE_REPO;

function buildRemoteConfig({ sourceRepo, sourceBranch } = {}) {
    const ownerRepo = normalizeOwnerRepo(sourceRepo || process.env.AGENTSKILLS_REPO || DEFAULT_SOURCE_REPO);
    if (!ownerRepo) {
        throw new Error('Invalid source repository. Use format owner/repo via --source-repo or AGENTSKILLS_REPO.');
    }

    const branch = (sourceBranch || process.env.AGENTSKILLS_BRANCH || DEFAULT_REPO_BRANCH).trim();
    return {
        ownerRepo,
        branch,
        rawBaseUrl: `https://raw.githubusercontent.com/${ownerRepo}/${branch}/.agents`,
        apiBaseUrl: `https://api.github.com/repos/${ownerRepo}/contents/.agents`
    };
}

let activeRemoteConfig = buildRemoteConfig();
// Single source of truth: domains.json (loaded at init; hardcoded fallback only if file missing)
const DEFAULT_DOMAIN_MAP = (() => {
    const domainFile = path.resolve(__dirname, '../.agents/domains.json');
    try {
        return JSON.parse(fs.readFileSync(domainFile, 'utf8'));
    } catch {
        return {
            backend: ['senior-backend', 'devops-engineer', 'qa-automation', 'code-auditor'],
            frontend: ['senior-frontend', 'ui-ux-designer', 'qa-automation', 'code-auditor'],
            game: ['game-architect', 'qa-automation', 'code-auditor'],
            ai: ['prompt-engineer', 'code-auditor'],
            web: ['senior-backend', 'senior-frontend', 'devops-engineer', 'qa-automation', 'code-auditor', 'ui-ux-designer'],
            all: [
                'senior-backend', 'senior-frontend', 'devops-engineer', 'qa-automation',
                'code-auditor', 'game-architect', 'prompt-engineer', 'ui-ux-designer'
            ]
        };
    }
})();
const DEFAULT_WORKFLOW_FILES = [
    'audit.md', 'backend.md', 'commit.md', 'debug.md',
    'frontend.md', 'manage-roles.md', 'mobile.md', 'db.md',
    'ai.md', 'test.md'
];
const AGENTSKILLS_META_DIR = '.agentskills';
const AGENTSKILLS_MANIFEST_PATH = path.join(process.cwd(), AGENTSKILLS_META_DIR, 'manifest.json');
const ASSISTANT_ALIASES = {
    gemin: 'gemini',
    claud: 'claude',
    copliot: 'copilot'
};

const ASSISTANT_PROFILES = {
    cursor: {
        mode: 'cursorlike',
        targetDir: '.cursor/rules',
        roleExt: '.mdc',
        commandDirs: ['.cursor/commands'],
        includeInAll: true
    },
    windsurf: {
        mode: 'cursorlike',
        targetDir: '.windsurf/rules',
        roleExt: '.mdc',
        commandDirs: ['.windsurf/commands']
    },
    claude: {
        mode: 'folder',
        targetDir: '.claude',
        commandDirs: ['.claude/commands'],
        includeInAll: true
    },
    kiro: {
        mode: 'folder',
        targetDir: '.kiro',
        commandDirs: ['.kiro/commands']
    },
    antigravity: {
        mode: 'folder',
        targetDir: '.gemini/antigravity',
        commandDirs: ['.gemini/antigravity/commands', '.gemini/commands']
    },
    gemini: {
        mode: 'flat',
        targetDir: '.gemini',
        roleExt: '.md',
        commandDirs: ['.gemini/commands']
    },
    codex: {
        mode: 'flat',
        targetDir: '.codex',
        roleExt: '.md'
    },
    qoder: {
        mode: 'flat',
        targetDir: '.qoder',
        roleExt: '.md'
    },
    roocode: {
        mode: 'flat',
        targetDir: '.roocode',
        roleExt: '.md'
    },
    trae: {
        mode: 'flat',
        targetDir: '.trae',
        roleExt: '.md'
    },
    opencode: {
        mode: 'flat',
        targetDir: '.opencode',
        roleExt: '.md'
    },
    continue: {
        mode: 'flat',
        targetDir: '.continue',
        roleExt: '.md'
    },
    droid: {
        mode: 'flat',
        targetDir: '.factory',
        roleExt: '.md'
    },
    copilot: {
        mode: 'monolithic',
        targetDir: '.github',
        includeInAll: true
    },
    codebuddy: {
        mode: 'monolithic',
        targetDir: '.codebuddy'
    }
};

const ASSISTANT_PATHS = Object.keys(ASSISTANT_PROFILES).reduce((acc, key) => {
    acc[key] = ASSISTANT_PROFILES[key].targetDir;
    return acc;
}, { all: 'all' });

async function loadESM() {
    try {
        chalk = (await import('chalk')).default;
        inquirer = (await import('inquirer')).default;
    } catch (err) {
        console.error('Failed to load ESM dependencies (chalk/inquirer). Ensure they are installed: npm install');
        process.exit(1);
    }
}

function ensureDirSync(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function toPosixRelative(filePath) {
    return path.relative(process.cwd(), filePath).replace(/\\/g, '/');
}

function ensureDir(dirPath, installState = null) {
    if (installState?.dryRun) {
        return;
    }
    ensureDirSync(dirPath);
}

function trackGeneratedFile(filePath, installState = null) {
    if (!installState) return;
    installState.generatedFiles.add(toPosixRelative(path.resolve(filePath)));
}

function writeFile(filePath, content, installState = null) {
    ensureDir(path.dirname(filePath), installState);
    if (!installState?.dryRun) {
        fs.writeFileSync(filePath, content);
    }
    trackGeneratedFile(filePath, installState);
}

function removeFile(filePath, installState = null) {
    const normalized = toPosixRelative(path.resolve(filePath));
    const exists = fs.existsSync(filePath);
    if (!exists) return;
    if (!installState?.dryRun) {
        fs.rmSync(filePath, { force: true });
    }
    if (installState) {
        installState.removedFiles.push(normalized);
    }
}

function readManifest() {
    if (!fs.existsSync(AGENTSKILLS_MANIFEST_PATH)) return { version: 1, assistants: {} };
    try {
        const parsed = JSON.parse(fs.readFileSync(AGENTSKILLS_MANIFEST_PATH, 'utf8'));
        if (!parsed || typeof parsed !== 'object') return { version: 1, assistants: {} };
        if (!parsed.assistants || typeof parsed.assistants !== 'object') {
            parsed.assistants = {};
        }
        return parsed;
    } catch {
        return { version: 1, assistants: {} };
    }
}

function writeManifest(manifest, installState = null) {
    const content = `${JSON.stringify(manifest, null, 2)}\n`;
    const metaDir = path.dirname(AGENTSKILLS_MANIFEST_PATH);
    ensureDir(metaDir, installState);
    if (!installState?.dryRun) {
        fs.writeFileSync(AGENTSKILLS_MANIFEST_PATH, content);
    }
}

function collectLegacyCandidates(assistant, profile) {
    const candidates = [];
    if (!profile) return candidates;

    if (assistant === 'cursor' || assistant === 'windsurf') {
        const ext = profile.roleExt || '.mdc';
        for (const workflow of DEFAULT_WORKFLOW_FILES) {
            const workflowName = path.basename(workflow, '.md');
            candidates.push(path.join(profile.targetDir, `workflows-${workflowName}${ext}`));
        }
    }

    if (assistant === 'antigravity') {
        for (const workflow of DEFAULT_WORKFLOW_FILES) {
            const workflowName = path.basename(workflow, '.md');
            candidates.push(path.join(profile.targetDir, `workflows-${workflowName}.md`));
        }
    }

    return candidates;
}

function finalizeInstallState(assistant, profile, installState) {
    const manifest = readManifest();
    const assistantState = manifest.assistants[assistant] || { files: [] };
    const previousFiles = new Set(Array.isArray(assistantState.files) ? assistantState.files : []);
    const nextFiles = Array.from(installState.generatedFiles).sort();
    const nextSet = new Set(nextFiles);

    if (installState.cleanupLegacy) {
        for (const relPath of previousFiles) {
            if (!nextSet.has(relPath)) {
                removeFile(path.join(process.cwd(), relPath), installState);
            }
        }

        const legacyCandidates = collectLegacyCandidates(assistant, profile);
        for (const relPath of legacyCandidates) {
            if (!nextSet.has(relPath.replace(/\\/g, '/'))) {
                removeFile(path.join(process.cwd(), relPath), installState);
            }
        }
    }

    manifest.version = 1;
    manifest.assistants[assistant] = {
        files: nextFiles,
        updatedAt: new Date().toISOString(),
        compat: installState.compat
    };
    writeManifest(manifest, installState);
}

function createInstallState(options) {
    return {
        dryRun: Boolean(options.dryRun),
        compat: options.compat !== false,
        cleanupLegacy: options.cleanupLegacy !== false,
        generatedFiles: new Set(),
        removedFiles: []
    };
}

function upsertManagedSection(filePath, startMarker, endMarker, sectionContent, installState = null) {
    const managedBlock = `${startMarker}\n${sectionContent}\n${endMarker}`;
    const current = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';

    const escapedStart = startMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedEnd = endMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const managedRegex = new RegExp(`${escapedStart}[\\s\\S]*?${escapedEnd}`, 'm');

    let next;
    if (managedRegex.test(current)) {
        next = current.replace(managedRegex, managedBlock);
    } else {
        const prefix = current.trim().length === 0 ? '' : `${current.trimEnd()}\n\n`;
        next = `${prefix}${managedBlock}\n`;
    }
    if (!installState?.dryRun) {
        fs.writeFileSync(filePath, next);
    }
    trackGeneratedFile(filePath, installState);
}

function resolveManagedAgentsRoot(installState = null) {
    const agentsRoot = path.join(process.cwd(), '.agents');
    const markerPath = path.join(agentsRoot, '.agentskills-managed');

    if (!fs.existsSync(agentsRoot)) {
        ensureDir(agentsRoot, installState);
        writeFile(markerPath, 'managed by agentskills-cli\n', installState);
        return agentsRoot;
    }

    if (fs.existsSync(markerPath)) {
        return agentsRoot;
    }

    // .agents/ exists but lacks the managed marker — write it and proceed.
    // writeManagedAgentsCompat only adds files and never removes existing ones,
    // so this is safe even if the directory was created manually.
    writeFile(markerPath, 'managed by agentskills-cli\n', installState);
    return agentsRoot;
}

function writeManagedAgentsCompat({ agentName, agentContent, globalRules, workflows, skillPayloads, installState }) {
    const agentsRoot = resolveManagedAgentsRoot(installState);
    if (!agentsRoot) return false;

    const agentsDir = path.join(agentsRoot, 'agents');
    const workflowsDir = path.join(agentsRoot, 'workflows');

    ensureDir(agentsDir, installState);
    ensureDir(workflowsDir, installState);

    if (agentName && agentContent) {
        writeFile(path.join(agentsDir, `${agentName}.md`), agentContent, installState);
    }
    if (globalRules) {
        writeFile(path.join(agentsRoot, 'global-rules.md'), globalRules, installState);
    }
    if (Array.isArray(workflows)) {
        for (const workflow of workflows) {
            writeFile(path.join(workflowsDir, workflow.name), workflow.content, installState);
        }
    }
    if (Array.isArray(skillPayloads) && skillPayloads.length > 0) {
        const skillsDir = path.join(agentsRoot, 'skills');
        ensureDir(skillsDir, installState);
        for (const s of skillPayloads) {
            const skillDest = path.join(skillsDir, s.name);
            ensureDir(skillDest, installState);
            if (s.skill) writeFile(path.join(skillDest, 'SKILL.md'), s.skill, installState);
            if (s.references && s.references.length > 0) {
                ensureDir(path.join(skillDest, 'references'), installState);
                for (const ref of s.references) {
                    writeFile(path.join(skillDest, 'references', ref.name), ref.content, installState);
                }
            }
            if (s.scripts && s.scripts.length > 0) {
                ensureDir(path.join(skillDest, 'scripts'), installState);
                for (const scr of s.scripts) {
                    writeFile(path.join(skillDest, 'scripts', scr.name), scr.content, installState);
                }
            }
        }
    }

    return true;
}

function syncCodexBootstrapFile(installState = null) {
    const codexDir = path.join(process.cwd(), '.codex');
    if (!fs.existsSync(codexDir)) return false;

    const allMdFiles = fs.readdirSync(codexDir).filter((f) => f.endsWith('.md')).sort();
    const roleFiles = allMdFiles.filter((f) => f !== 'global-rules.md' && !f.startsWith('workflows-'));
    const workflowFiles = allMdFiles.filter((f) => f.startsWith('workflows-'));
    const globalRulesPath = path.join(codexDir, 'global-rules.md');
    const hasGlobalRules = fs.existsSync(globalRulesPath);

    const lines = [];
    lines.push('# AgentSkills Codex Bootstrap');
    lines.push('');
    lines.push('When this repository is open in Codex, follow these rules before answering:');
    lines.push('');
    lines.push('1. Read `.codex/global-rules.md` first when present.');
    lines.push('2. Select the most relevant role file from `.codex/*.md` based on user intent.');
    lines.push('3. Apply matching workflow guidance from `.codex/workflows-*.md` when relevant.');
    lines.push('4. If helper scripts are needed, use `.agent_scripts/` paths generated by AgentSkills.');
    lines.push('5. Keep output concise and implementation-focused.');
    lines.push('');

    if (hasGlobalRules) {
        lines.push('Global rules file:');
        lines.push('- `.codex/global-rules.md`');
        lines.push('');
    }

    if (roleFiles.length > 0) {
        lines.push('Installed role files:');
        for (const roleFile of roleFiles) {
            lines.push(`- \`.codex/${roleFile}\``);
        }
        lines.push('');
    }

    if (workflowFiles.length > 0) {
        lines.push('Installed workflow files:');
        for (const workflowFile of workflowFiles) {
            lines.push(`- \`.codex/${workflowFile}\``);
        }
        lines.push('');
    }

    const section = lines.join('\n').trimEnd();
    const agentsFile = path.join(process.cwd(), 'AGENTS.md');
    upsertManagedSection(
        agentsFile,
        '<!-- AGENTSKILLS-CODEX-START -->',
        '<!-- AGENTSKILLS-CODEX-END -->',
        section,
        installState
    );
    return true;
}

async function fetchFileContent(filePath, useLocal, remoteConfig = activeRemoteConfig) {
    if (useLocal) {
        const fullLocalPath = path.join(LOCAL_DEV_PATH, filePath);
        if (fs.existsSync(fullLocalPath)) {
            return fs.readFileSync(fullLocalPath, 'utf8');
        }
        return null; // Return null if file doesn't exist
    }

    const url = `${remoteConfig.rawBaseUrl}/${filePath}`;
    return new Promise((resolve, reject) => {
        let data = '';
        https.get(url, (res) => {
            if (res.statusCode === 404) return resolve(null);
            if (res.statusCode !== 200) {
                reject(new Error(
                    `Failed ${url}: ${res.statusCode}. Verify source repo (${remoteConfig.ownerRepo}) and branch (${remoteConfig.branch}).`
                ));
                return;
            }
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

// Simple YAML Frontmatter parser for our specific use-case
function parseFrontmatter(content) {
    const skills = [];
    let processingSkills = false;
    let mdContent = content;
    
    const lines = content.split('\n');
    if (lines[0].trim() === '---') {
        let endIndex = 1;
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '---') {
                endIndex = i;
                break;
            }
            if (lines[i].startsWith('skills:')) {
                processingSkills = true;
                continue;
            }
            if (processingSkills) {
                if (lines[i].trim().startsWith('-')) {
                    skills.push(lines[i].replace('-', '').trim());
                } else if (lines[i].trim() !== '') {
                    // Reached the end of the skills array
                    processingSkills = false;
                }
            }
        }
        mdContent = lines.slice(endIndex + 1).join('\n').trim();
    }
    return { skills, mdContent };
}

// Minimal GitHub API abstraction to list files in a directory
async function listGithubFiles(repoPath, remoteConfig = activeRemoteConfig) {
    const url = `${remoteConfig.apiBaseUrl}/${repoPath}?ref=${encodeURIComponent(remoteConfig.branch)}`;
    return new Promise((resolve) => {
        https.get(url, { headers: { 'User-Agent': 'AgentSkills-CLI' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (Array.isArray(json)) {
                        resolve(json.filter(f => f.type === 'file').map(f => f.name));
                    } else {
                        resolve([]);
                    }
                } catch(e) { resolve([]); }
            });
        }).on('error', () => resolve([]));
    });
}

function getLocalAgentNames() {
    const dir = path.join(LOCAL_DEV_PATH, 'agents');
    if (!fs.existsSync(dir)) return [];
    return fs
        .readdirSync(dir)
        .filter((f) => f.endsWith('.md'))
        .map((f) => path.basename(f, '.md'))
        .sort();
}

function loadLocalDomains() {
    const domainFile = path.join(LOCAL_DEV_PATH, 'domains.json');
    if (!fs.existsSync(domainFile)) return DEFAULT_DOMAIN_MAP;
    try {
        const parsed = JSON.parse(fs.readFileSync(domainFile, 'utf8'));
        return { ...DEFAULT_DOMAIN_MAP, ...parsed };
    } catch {
        return DEFAULT_DOMAIN_MAP;
    }
}

async function loadRemoteDomains(remoteConfig = activeRemoteConfig) {
    const domainContent = await fetchFileContent('domains.json', false, remoteConfig);
    if (!domainContent) return DEFAULT_DOMAIN_MAP;
    try {
        const parsed = JSON.parse(domainContent);
        return { ...DEFAULT_DOMAIN_MAP, ...parsed };
    } catch {
        return DEFAULT_DOMAIN_MAP;
    }
}

async function resolveAgentsForDomain(domainName, useLocal, remoteConfig = activeRemoteConfig) {
    const domains = useLocal ? loadLocalDomains() : await loadRemoteDomains(remoteConfig);
    const selected = domains[domainName];
    return Array.isArray(selected) ? selected : null;
}

async function getAvailableAgentNames(useLocal, remoteConfig = activeRemoteConfig) {
    if (useLocal) return getLocalAgentNames();
    const files = await listGithubFiles('agents', remoteConfig);
    return files
        .filter((f) => f.endsWith('.md'))
        .map((f) => path.basename(f, '.md'))
        .sort();
}

function getDomainChoices(useLocal) {
    const domains = useLocal ? loadLocalDomains() : DEFAULT_DOMAIN_MAP;
    return Object.keys(domains).sort();
}

function resolveAssistants(assistant) {
    if (assistant === 'all') {
        return Object.keys(ASSISTANT_PROFILES).filter((name) => ASSISTANT_PROFILES[name].includeInAll);
    }
    return [assistant];
}

async function gatherSkillFiles(skillPath, useLocal, remoteConfig = activeRemoteConfig) {
    const files = { skill: null, references: [], scripts: [] };
    
    // 1. Fetch SKILL.md
    files.skill = await fetchFileContent(`skills/${skillPath}/SKILL.md`, useLocal, remoteConfig);
    
    // 2. Fetch references and scripts
    if (useLocal) {
        const refDir = path.join(LOCAL_DEV_PATH, `skills/${skillPath}/references`);
        const scriptDir = path.join(LOCAL_DEV_PATH, `skills/${skillPath}/scripts`);
        
        if (fs.existsSync(refDir)) {
            const refFiles = fs.readdirSync(refDir).filter(f => f.endsWith('.md'));
            for (const f of refFiles) {
                files.references.push({ name: f, content: fs.readFileSync(path.join(refDir, f), 'utf8') });
            }
        }
        if (fs.existsSync(scriptDir)) {
            const scriptFiles = fs.readdirSync(scriptDir);
            for (const f of scriptFiles) {
                files.scripts.push({ name: f, content: fs.readFileSync(path.join(scriptDir, f), 'utf8') });
            }
        }
    } else {
        // Fetch from GitHub (parallelized)
        const [refFiles, scriptFiles] = await Promise.all([
            listGithubFiles(`skills/${skillPath}/references`, remoteConfig),
            listGithubFiles(`skills/${skillPath}/scripts`, remoteConfig)
        ]);

        const [refContents, scriptContents] = await Promise.all([
            Promise.all(refFiles.map(f => fetchFileContent(`skills/${skillPath}/references/${f}`, false, remoteConfig).then(content => content ? { name: f, content } : null))),
            Promise.all(scriptFiles.map(f => fetchFileContent(`skills/${skillPath}/scripts/${f}`, false, remoteConfig).then(content => content ? { name: f, content } : null)))
        ]);

        files.references = refContents.filter(Boolean);
        files.scripts = scriptContents.filter(Boolean);
    }
    
    return files;
}

async function gatherWorkflowFiles(useLocal, remoteConfig = activeRemoteConfig) {
    const workflows = [];

    if (useLocal) {
        const workflowDir = path.join(LOCAL_DEV_PATH, 'workflows');
        if (!fs.existsSync(workflowDir)) return workflows;

        const files = fs.readdirSync(workflowDir)
            .filter((f) => f.endsWith('.md'))
            .sort();
        for (const file of files) {
            workflows.push({
                name: file,
                content: fs.readFileSync(path.join(workflowDir, file), 'utf8')
            });
        }
        return workflows;
    }

    let files = (await listGithubFiles('workflows', remoteConfig))
        .filter((f) => f.endsWith('.md'))
        .sort();
    if (files.length === 0) {
        files = [...DEFAULT_WORKFLOW_FILES];
    }
    const results = await Promise.all(
        files.map(file => fetchFileContent(`workflows/${file}`, false, remoteConfig).then(content => content ? { name: file, content } : null))
    );
    return results.filter(Boolean);
}

async function installAgent(agentName, assistant, useLocal, remoteConfig = activeRemoteConfig, installState = null) {
    const profile = ASSISTANT_PROFILES[assistant];
    if (!profile) {
        console.error(chalk.red(`❌ Unsupported AI assistant: ${assistant}`));
        return false;
    }

    const fullTargetDir = path.join(process.cwd(), profile.targetDir);
    console.log(chalk.blue(`\n🚀 Initializing AgentSkills for ${chalk.bold(assistant)}...`));
    console.log(chalk.magenta(`🛡️  Targeting Agent Persona: ${chalk.bold(agentName)}`));
    
    // Fetch Agent file
    const agentContent = await fetchFileContent(`agents/${agentName}.md`, useLocal, remoteConfig);
    if (!agentContent) {
        console.error(chalk.red(`❌ Agent persona '${agentName}' not found.`));
        return false;
    }
    
    ensureDir(fullTargetDir, installState);
    
    const { skills, mdContent: pureAgentMd } = parseFrontmatter(agentContent);
    console.log(chalk.gray(`📦 Found ${skills.length} dependency skills to resolve.`));
    
    const skillPayloads = [];
    for (const skill of skills) {
        console.log(chalk.yellow(`   ↳ Resolving skill: ${skill}...`));
        const payload = await gatherSkillFiles(skill, useLocal, remoteConfig);
        skillPayloads.push({ name: skill, ...payload });
    }
    
    // Global Rules
    const globalRules = await fetchFileContent(`global-rules.md`, useLocal, remoteConfig);
    const workflows = await gatherWorkflowFiles(useLocal, remoteConfig);
    console.log(chalk.gray(`📚 Found ${workflows.length} workflow(s).`));

    if (installState?.compat) {
        const wroteCompat = writeManagedAgentsCompat({
            agentName,
            agentContent: pureAgentMd,
            globalRules,
            workflows,
            skillPayloads,
            installState
        });
        if (wroteCompat) {
            console.log(chalk.gray(`   ↳ Synced compatibility export to .agents/ (agents, skills, workflows)`));
        } else {
            console.log(chalk.gray(`   ↳ Skipped .agents sync`));
        }
    }
    
    // Formatting Phase
    if (profile.mode === 'monolithic') {
        // MONOLITHIC BUNDLE
        let bundle = `# Global Ecosystem Rules\n\n${globalRules || ''}\n\n`;
        bundle += `# Agent Persona: ${agentName}\n\n${pureAgentMd}\n\n`;
        
        for (const s of skillPayloads) {
            bundle += `## Skill: ${s.name}\n\n${s.skill}\n\n`;
            for (const ref of s.references) {
                bundle += `### Reference: ${ref.name}\n\n${ref.content}\n\n`;
            }
        }
        if (workflows.length > 0) {
            bundle += `# Workflows\n\n`;
            for (const workflow of workflows) {
                const workflowName = path.basename(workflow.name, '.md');
                bundle += `## /${workflowName}\n\n${workflow.content}\n\n`;
            }
        }
        writeFile(path.join(fullTargetDir, `${agentName}-instructions.md`), bundle, installState);
        console.log(chalk.green(`✅ Generated monolithic bundle for ${assistant}.`));
    } 
    else if (profile.mode === 'folder') {
        // FOLDER BUNDLE
        const agentDest = path.join(fullTargetDir, `agents`);
        ensureDir(agentDest, installState);
        writeFile(path.join(agentDest, `${agentName}.md`), pureAgentMd, installState);
        if (globalRules) {
            const globalRulesDest = path.join(fullTargetDir, `skills`);
            ensureDir(globalRulesDest, installState);
            writeFile(path.join(globalRulesDest, `global-rules.md`), globalRules, installState);
        }
        
        for (const s of skillPayloads) {
            const skillDest = path.join(fullTargetDir, `skills`, s.name);
            ensureDir(skillDest, installState);
            if (s.skill) writeFile(path.join(skillDest, `SKILL.md`), s.skill, installState);
            
            if (s.references.length > 0) {
                ensureDir(path.join(skillDest, `references`), installState);
                for (const ref of s.references) writeFile(path.join(skillDest, `references`, ref.name), ref.content, installState);
            }
            if (s.scripts.length > 0) {
                ensureDir(path.join(skillDest, `scripts`), installState);
                for (const scr of s.scripts) writeFile(path.join(skillDest, `scripts`, scr.name), scr.content, installState);
            }
        }
        if (workflows.length > 0) {
            const workflowDest = path.join(fullTargetDir, `skills`, `workflows`);
            ensureDir(workflowDest, installState);
            for (const workflow of workflows) {
                writeFile(path.join(workflowDest, workflow.name), workflow.content, installState);
            }

            for (const commandDir of profile.commandDirs || []) {
                const fullCommandDir = path.join(process.cwd(), commandDir);
                ensureDir(fullCommandDir, installState);
                for (const workflow of workflows) {
                    writeFile(path.join(fullCommandDir, workflow.name), workflow.content, installState);
                }
            }
        }
        console.log(chalk.green(`✅ Extracted folders and scripts for ${assistant}.`));
    }
    else {
        // CURSORLIKE / FLAT
        const isCursorLike = profile.mode === 'cursorlike';
        const ext = profile.roleExt || '.md';

        if (globalRules) {
            const globalRulesFile = path.join(fullTargetDir, `global-rules${ext}`);
            if (isCursorLike) {
                const globalRulesMdc = `---\ndescription: Global Ecosystem Rules\nglobs: *\n---\n\n${globalRules}`;
                writeFile(globalRulesFile, globalRulesMdc, installState);
            } else {
                writeFile(globalRulesFile, `# Global Rules\n\n${globalRules}`, installState);
            }
        }
        
        let agentDoc = '';
        if (isCursorLike) {
            agentDoc = `---\ndescription: Agent Persona - ${agentName}\nglobs: *\n---\n\n`;
            agentDoc += `# Global Rules\n${globalRules || ''}\n\n`;
            agentDoc += `# Agent Persona\n${pureAgentMd}\n\n`;
        } else {
            agentDoc = `# Global Rules\n${globalRules || ''}\n\n# Agent Persona\n${pureAgentMd}\n\n`;
        }
        
        for (const s of skillPayloads) {
            agentDoc += `## Capability: ${s.name}\n${s.skill || ''}\n`;
            for (const ref of s.references) {
                agentDoc += `### Reference: ${ref.name}\n<reference>\n${ref.content}\n</reference>\n`;
            }
        }
        
        writeFile(path.join(fullTargetDir, `${agentName}${ext}`), agentDoc, installState);
        
        // Write scripts to a local hidden tools folder
        for (const s of skillPayloads) {
            if (s.scripts.length > 0) {
                const scriptDest = path.join(process.cwd(), '.agent_scripts', s.name.replace('/', '_'));
                ensureDir(scriptDest, installState);
                for (const scr of s.scripts) writeFile(path.join(scriptDest, scr.name), scr.content, installState);
                console.log(chalk.gray(`   ↳ Extracted scripts to .agent_scripts/`));
            }
        }

        for (const workflow of workflows) {
            const workflowName = path.basename(workflow.name, '.md');
            for (const commandDir of profile.commandDirs || []) {
                const fullCommandDir = path.join(process.cwd(), commandDir);
                ensureDir(fullCommandDir, installState);
                writeFile(path.join(fullCommandDir, workflow.name), workflow.content, installState);
            }
            if (profile.mode === 'flat') {
                writeFile(path.join(fullTargetDir, `workflows-${workflowName}${ext}`), workflow.content, installState);
            }
        }

        if (assistant === 'codex') {
            const syncedBootstrap = syncCodexBootstrapFile(installState);
            if (syncedBootstrap) {
                console.log(chalk.gray(`   ↳ Synced Codex bootstrap instructions to AGENTS.md`));
            }
        }
        
        console.log(chalk.green(`✅ Packed Agent and Skills into ${agentName}${ext}`));
    }
    
    console.log(chalk.blue.bold(`\n🎉 Successfully installed ${agentName} for ${assistant}!`));
    return true;
}

async function installAgents(agentNames, assistant, useLocal, remoteConfig = activeRemoteConfig, installOptions = {}) {
    const targetAssistants = resolveAssistants(assistant);
    const failed = [];

    for (const targetAssistant of targetAssistants) {
        const targetProfile = ASSISTANT_PROFILES[targetAssistant];
        const targetState = createInstallState(installOptions);
        for (const agentName of agentNames) {
            const ok = await installAgent(agentName, targetAssistant, useLocal, remoteConfig, targetState);
            if (!ok) failed.push({ assistant: targetAssistant, agent: agentName });
        }
        finalizeInstallState(targetAssistant, targetProfile, targetState);
        if (targetState.dryRun) {
            console.log(chalk.cyan(`📝 Dry run summary for ${targetAssistant}:`));
            console.log(chalk.cyan(`   - files to generate/update: ${targetState.generatedFiles.size}`));
            console.log(chalk.cyan(`   - files to remove: ${targetState.removedFiles.length}`));
        }
    }

    if (failed.length > 0) {
        console.error(chalk.red(`\n❌ Failed to install ${failed.length} item(s):`));
        for (const item of failed) {
            console.error(chalk.red(` - ${item.agent} -> ${item.assistant}`));
        }
        process.exitCode = 1;
    }
}

async function run() {
    await loadESM();

    program
      .name('agentskills')
      .description('CLI to seamlessly install Universal Agent Roles & Skills into your AI assistant.')
      .version(CLI_VERSION);

    program.command('list')
      .description('List available agents, domains, or supported platforms')
      .option('--agents', 'List all available agents')
      .option('--domains', 'List all available domains and their agents')
      .option('--platforms', 'List all supported AI platforms')
      .option('--local', 'Use local files instead of downloading from GitHub')
      .action(async (options) => {
          if (options.platforms) {
              console.log(chalk.bold('\nSupported AI Platforms:'));
              for (const [name, profile] of Object.entries(ASSISTANT_PROFILES)) {
                  console.log(`  ${chalk.green(name.padEnd(16))} ${chalk.gray(profile.targetDir)} (${profile.mode})`);
              }
              console.log('');
          } else if (options.domains) {
              const domains = options.local ? loadLocalDomains() : DEFAULT_DOMAIN_MAP;
              console.log(chalk.bold('\nAvailable Domains:'));
              for (const [domain, agents] of Object.entries(domains)) {
                  console.log(`  ${chalk.green(domain.padEnd(12))} ${chalk.gray(agents.join(', '))}`);
              }
              console.log('');
          } else {
              // Default: list agents
              const agents = options.local ? getLocalAgentNames() : Object.keys(DEFAULT_DOMAIN_MAP).includes('all') ? DEFAULT_DOMAIN_MAP.all : getLocalAgentNames();
              console.log(chalk.bold('\nAvailable Agents:'));
              for (const agent of agents) {
                  console.log(`  ${chalk.green(agent)}`);
              }
              console.log('');
          }
      });

    program.command('init')
      .description('Initialize AgentSkills by persona (--agent) or bundle (--domain) for a specific AI assistant')
      .option('--agent <name>', 'Specify the Agent Persona (e.g., senior-backend, code-auditor)')
      .option('--domain <name>', `Specify a domain bundle (${Object.keys(DEFAULT_DOMAIN_MAP).join(', ')})`)
      .option('-a, --ai <platform>', `Specify the AI assistant (${Object.keys(ASSISTANT_PATHS).join(', ')})`)
      .option('--source-repo <owner/repo>', 'Override remote source repository (default: package repository or AGENTSKILLS_REPO)')
      .option('--source-branch <branch>', 'Override remote source branch (default: main or AGENTSKILLS_BRANCH)')
      .option('--local', 'Use local files instead of downloading from GitHub (for development)')
      .option('--no-compat', 'Disable compatibility exports (enabled by default)')
      .option('--no-cleanup-legacy', 'Disable cleanup of managed legacy files')
      .option('--dry-run', 'Preview writes/removals without modifying files')
      .action(async (options) => {
          let assistant = options.ai;
          let agent = options.agent ? options.agent.toLowerCase() : null;
          let domain = options.domain ? options.domain.toLowerCase() : null;
          let remoteConfig = activeRemoteConfig;

          try {
              remoteConfig = buildRemoteConfig({
                  sourceRepo: options.sourceRepo,
                  sourceBranch: options.sourceBranch
              });
              activeRemoteConfig = remoteConfig;
          } catch (err) {
              console.error(chalk.red(`❌ ${err.message}`));
              process.exit(1);
          }

          if (agent && domain) {
              console.error(chalk.red('❌ Use either --agent or --domain, not both.'));
              process.exit(1);
          }

          if (!assistant) {
             const answer = await inquirer.prompt([{
                 type: 'list',
                 name: 'assistant',
                 message: 'Which AI Assistant are you installing AgentSkills for?',
                 choices: [...Object.keys(ASSISTANT_PROFILES), 'all']
             }]);
             assistant = answer.assistant;
          }

          assistant = assistant.toLowerCase();
          if (!ASSISTANT_PATHS[assistant]) {
              const suggestion = ASSISTANT_ALIASES[assistant];
              if (suggestion) {
                  console.error(chalk.red(`❌ Unsupported AI assistant: ${assistant}. Did you mean '${suggestion}'?`));
              } else {
                  console.error(chalk.red(`❌ Unsupported AI assistant: ${assistant}`));
              }
              process.exit(1);
          }

          if (!agent && !domain) {
              const typeAnswer = await inquirer.prompt([{
                  type: 'list',
                  name: 'selectionType',
                  message: 'Do you want to install a single agent or a domain bundle?',
                  choices: ['agent', 'domain']
              }]);

              if (typeAnswer.selectionType === 'agent') {
                  const availableAgents = await getAvailableAgentNames(Boolean(options.local), remoteConfig);
                  if (availableAgents.length === 0) {
                      console.error(chalk.red('❌ No agent templates found.'));
                      console.error(chalk.gray(`Checked source: ${remoteConfig.ownerRepo}@${remoteConfig.branch}`));
                      process.exit(1);
                  }
                  const answer = await inquirer.prompt([{
                      type: 'list',
                      name: 'agent',
                      message: 'Select an agent persona:',
                      choices: availableAgents
                  }]);
                  agent = answer.agent;
              } else {
                  const domainChoices = getDomainChoices(Boolean(options.local));
                  const answer = await inquirer.prompt([{
                      type: 'list',
                      name: 'domain',
                      message: 'Select a domain bundle:',
                      choices: domainChoices
                  }]);
                  domain = answer.domain;
              }
          }

          if (agent) {
              await installAgents([agent], assistant, Boolean(options.local), remoteConfig, {
                  dryRun: Boolean(options.dryRun),
                  compat: Boolean(options.compat),
                  cleanupLegacy: Boolean(options.cleanupLegacy)
              });
          } else {
              const domainAgents = await resolveAgentsForDomain(domain, Boolean(options.local), remoteConfig);
              if (!domainAgents) {
                  console.error(chalk.red(`❌ Unknown domain: ${domain}`));
                  process.exit(1);
              }
              await installAgents(domainAgents, assistant, Boolean(options.local), remoteConfig, {
                  dryRun: Boolean(options.dryRun),
                  compat: Boolean(options.compat),
                  cleanupLegacy: Boolean(options.cleanupLegacy)
              });
          }
      });

    program.parse(process.argv);
}

if (require.main === module) {
    run().catch(err => {
        console.error(err);
        process.exit(1);
    });
}

module.exports = {
    parseFrontmatter,
    resolveAssistants,
    resolveAgentsForDomain,
    getAvailableAgentNames,
    loadLocalDomains,
    gatherWorkflowFiles,
    writeManagedAgentsCompat,
    syncCodexBootstrapFile,
    DEFAULT_DOMAIN_MAP,
    normalizeOwnerRepo,
    buildRemoteConfig,
    DEFAULT_SOURCE_REPO,
    DEFAULT_REPO_BRANCH
};
