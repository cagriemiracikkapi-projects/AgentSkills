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
const DEFAULT_DOMAIN_MAP = {
    backend: ['senior-backend', 'devops-engineer', 'qa-automation', 'code-auditor'],
    frontend: ['senior-frontend', 'ui-ux-designer', 'qa-automation', 'code-auditor'],
    game: ['game-architect', 'qa-automation', 'code-auditor'],
    ai: ['prompt-engineer', 'code-auditor'],
    web: ['senior-backend', 'senior-frontend', 'devops-engineer', 'qa-automation', 'code-auditor', 'ui-ux-designer'],
    all: [
        'senior-backend',
        'senior-frontend',
        'devops-engineer',
        'qa-automation',
        'code-auditor',
        'game-architect',
        'prompt-engineer',
        'ui-ux-designer'
    ]
};
const DEFAULT_WORKFLOW_FILES = ['audit.md', 'commit.md', 'frontend.md', 'manage-roles.md', 'test.md'];
const ASSISTANT_PATHS = {
    cursor: '.cursor/rules',
    windsurf: '.windsurf/rules',
    claude: '.claude',
    gemini: '.gemini',
    antigravity: '.gemini/antigravity',
    copilot: '.github',
    kiro: '.kiro',
    codex: '.codex',
    qoder: '.qoder',
    roocode: '.roocode',
    trae: '.trae',
    opencode: '.opencode',
    continue: '.continue',
    codebuddy: '.codebuddy',
    droid: '.factory',
    all: 'all'
};

async function loadESM() {
    chalk = (await import('chalk')).default;
    inquirer = (await import('inquirer')).default;
}

function ensureDirSync(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
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
    if (assistant === 'all') return ['cursor', 'claude', 'copilot'];
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
        // Fetch from GitHub
        const refFiles = await listGithubFiles(`skills/${skillPath}/references`, remoteConfig);
        for (const f of refFiles) {
            const content = await fetchFileContent(`skills/${skillPath}/references/${f}`, false, remoteConfig);
            if (content) files.references.push({ name: f, content });
        }
        
        const scriptFiles = await listGithubFiles(`skills/${skillPath}/scripts`, remoteConfig);
        for (const f of scriptFiles) {
            const content = await fetchFileContent(`skills/${skillPath}/scripts/${f}`, false, remoteConfig);
            if (content) files.scripts.push({ name: f, content });
        }
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
    for (const file of files) {
        const content = await fetchFileContent(`workflows/${file}`, false, remoteConfig);
        if (content) workflows.push({ name: file, content });
    }
    return workflows;
}

async function installAgent(agentName, assistant, useLocal, remoteConfig = activeRemoteConfig) {
    const targetDir = ASSISTANT_PATHS[assistant];
    if (!targetDir) {
        console.error(chalk.red(`❌ Unsupported AI assistant: ${assistant}`));
        return false;
    }

    const fullTargetDir = path.join(process.cwd(), targetDir);
    console.log(chalk.blue(`\n🚀 Initializing AgentSkills for ${chalk.bold(assistant)}...`));
    console.log(chalk.magenta(`🛡️  Targeting Agent Persona: ${chalk.bold(agentName)}`));
    
    // Fetch Agent file
    const agentContent = await fetchFileContent(`agents/${agentName}.md`, useLocal, remoteConfig);
    if (!agentContent) {
        console.error(chalk.red(`❌ Agent persona '${agentName}' not found.`));
        return false;
    }
    
    ensureDirSync(fullTargetDir);
    
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
    
    // Formatting Phase
    if (assistant === 'copilot' || assistant === 'codebuddy') {
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
        fs.writeFileSync(path.join(fullTargetDir, `${agentName}-instructions.md`), bundle);
        console.log(chalk.green(`✅ Generated monolithic bundle for ${assistant}.`));
    } 
    else if (assistant === 'claude' || assistant === 'kiro' || assistant === 'antigravity') {
        // FOLDER BUNDLE
        const agentDest = path.join(fullTargetDir, `agents`);
        ensureDirSync(agentDest);
        fs.writeFileSync(path.join(agentDest, `${agentName}.md`), pureAgentMd);
        if (globalRules) {
            const globalRulesDest = path.join(fullTargetDir, `skills`);
            ensureDirSync(globalRulesDest);
            fs.writeFileSync(path.join(globalRulesDest, `global-rules.md`), globalRules);
        }
        
        for (const s of skillPayloads) {
            const skillDest = path.join(fullTargetDir, `skills`, s.name);
            ensureDirSync(skillDest);
            if (s.skill) fs.writeFileSync(path.join(skillDest, `SKILL.md`), s.skill);
            
            if (s.references.length > 0) {
                ensureDirSync(path.join(skillDest, `references`));
                for (const ref of s.references) fs.writeFileSync(path.join(skillDest, `references`, ref.name), ref.content);
            }
            if (s.scripts.length > 0) {
                ensureDirSync(path.join(skillDest, `scripts`));
                for (const scr of s.scripts) fs.writeFileSync(path.join(skillDest, `scripts`, scr.name), scr.content);
            }
        }
        if (workflows.length > 0) {
            const workflowDest = path.join(fullTargetDir, `skills`, `workflows`);
            ensureDirSync(workflowDest);
            for (const workflow of workflows) {
                fs.writeFileSync(path.join(workflowDest, workflow.name), workflow.content);
            }
            if (assistant === 'claude' || assistant === 'antigravity') {
                const commandDirs = [path.join(fullTargetDir, `commands`)];
                if (assistant === 'antigravity') {
                    // Some Antigravity/Gemini setups read commands from .gemini/commands
                    commandDirs.push(path.join(process.cwd(), '.gemini', 'commands'));
                }
                for (const dir of commandDirs) ensureDirSync(dir);
                for (const workflow of workflows) {
                    for (const dir of commandDirs) {
                        fs.writeFileSync(path.join(dir, workflow.name), workflow.content);
                    }
                }
            }
        }
        console.log(chalk.green(`✅ Extracted folders and scripts for ${assistant}.`));
    }
    else {
        // CURSOR / WINDSURF (.mdc or flat structure)
        const isCursorLike = assistant === 'cursor' || assistant === 'windsurf';
        const ext = isCursorLike ? '.mdc' : '.md';

        if (globalRules) {
            const globalRulesFile = path.join(fullTargetDir, `global-rules${ext}`);
            if (isCursorLike) {
                const globalRulesMdc = `---\ndescription: Global Ecosystem Rules\nglobs: *\n---\n\n${globalRules}`;
                fs.writeFileSync(globalRulesFile, globalRulesMdc);
            } else {
                fs.writeFileSync(globalRulesFile, `# Global Rules\n\n${globalRules}`);
            }
        }
        
        let agentMdc = `---\ndescription: Agent Persona - ${agentName}\nglobs: *\n---\n\n`;
        agentMdc += `# Global Rules\n${globalRules || ''}\n\n`;
        agentMdc += `# Agent Persona\n${pureAgentMd}\n\n`;
        
        for (const s of skillPayloads) {
            agentMdc += `## Capability: ${s.name}\n${s.skill || ''}\n`;
            for (const ref of s.references) {
                agentMdc += `### Reference: ${ref.name}\n<reference>\n${ref.content}\n</reference>\n`;
            }
        }
        
        fs.writeFileSync(path.join(fullTargetDir, `${agentName}${ext}`), agentMdc);
        
        // Write scripts to a local hidden tools folder out of the way, since Cursor can't easily execute them attached to the .mdc directly yet
        for (const s of skillPayloads) {
            if (s.scripts.length > 0) {
                const scriptDest = path.join(process.cwd(), '.agent_scripts', s.name.replace('/', '_'));
                ensureDirSync(scriptDest);
                for (const scr of s.scripts) fs.writeFileSync(path.join(scriptDest, scr.name), scr.content);
                console.log(chalk.gray(`   ↳ Extracted scripts to .agent_scripts/`));
            }
        }
        let commandsDir = null;
        if (isCursorLike && workflows.length > 0) {
            commandsDir = path.join(path.dirname(fullTargetDir), 'commands');
            ensureDirSync(commandsDir);
        }
        let geminiCommandsDir = null;
        if (assistant === 'gemini' && workflows.length > 0) {
            geminiCommandsDir = path.join(fullTargetDir, 'commands');
            ensureDirSync(geminiCommandsDir);
        }
        for (const workflow of workflows) {
            const workflowName = path.basename(workflow.name, '.md');
            if (isCursorLike) {
                fs.writeFileSync(path.join(commandsDir, workflow.name), workflow.content);
            } else if (assistant === 'gemini') {
                fs.writeFileSync(path.join(geminiCommandsDir, workflow.name), workflow.content);
                fs.writeFileSync(path.join(fullTargetDir, `workflows-${workflowName}${ext}`), workflow.content);
            } else {
                fs.writeFileSync(path.join(fullTargetDir, `workflows-${workflowName}${ext}`), workflow.content);
            }
        }
        
        console.log(chalk.green(`✅ Packed Agent and Skills into ${agentName}${ext}`));
    }
    
    console.log(chalk.blue.bold(`\n🎉 Successfully installed ${agentName} for ${assistant}!`));
    return true;
}

async function installAgents(agentNames, assistant, useLocal, remoteConfig = activeRemoteConfig) {
    const targetAssistants = resolveAssistants(assistant);
    const failed = [];

    for (const targetAssistant of targetAssistants) {
        for (const agentName of agentNames) {
            const ok = await installAgent(agentName, targetAssistant, useLocal, remoteConfig);
            if (!ok) failed.push({ assistant: targetAssistant, agent: agentName });
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

    program.command('init')
      .description('Initialize AgentSkills by persona (--agent) or bundle (--domain) for a specific AI assistant')
      .option('--agent <name>', 'Specify the Agent Persona (e.g., senior-backend, code-auditor)')
      .option('--domain <name>', `Specify a domain bundle (${Object.keys(DEFAULT_DOMAIN_MAP).join(', ')})`)
      .option('-a, --ai <platform>', `Specify the AI assistant (${Object.keys(ASSISTANT_PATHS).join(', ')})`)
      .option('--source-repo <owner/repo>', 'Override remote source repository (default: package repository or AGENTSKILLS_REPO)')
      .option('--source-branch <branch>', 'Override remote source branch (default: main or AGENTSKILLS_BRANCH)')
      .option('--local', 'Use local files instead of downloading from GitHub (for development)')
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
                 choices: Object.keys(ASSISTANT_PATHS)
             }]);
             assistant = answer.assistant;
          }

          assistant = assistant.toLowerCase();
          if (!ASSISTANT_PATHS[assistant]) {
              console.error(chalk.red(`❌ Unsupported AI assistant: ${assistant}`));
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
              await installAgents([agent], assistant, Boolean(options.local), remoteConfig);
          } else {
              const domainAgents = await resolveAgentsForDomain(domain, Boolean(options.local), remoteConfig);
              if (!domainAgents) {
                  console.error(chalk.red(`❌ Unknown domain: ${domain}`));
                  process.exit(1);
              }
              await installAgents(domainAgents, assistant, Boolean(options.local), remoteConfig);
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
    DEFAULT_DOMAIN_MAP,
    normalizeOwnerRepo,
    buildRemoteConfig,
    DEFAULT_SOURCE_REPO,
    DEFAULT_REPO_BRANCH
};
