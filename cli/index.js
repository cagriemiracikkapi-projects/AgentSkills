#!/usr/bin/env node

const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const https = require('https');

let chalk;
let inquirer;

const REPO_URL = 'https://raw.githubusercontent.com/AgentSkills/AgentSkills/main/.agents';
const LOCAL_DEV_PATH = path.resolve(__dirname, '../.agents');

const ASSISTANT_PATHS = {
    cursor: '.cursor/rules',
    windsurf: '.windsurf/rules',
    claude: '.claude/skills',
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

async function fetchFileContent(filePath, useLocal) {
    if (useLocal) {
        const fullLocalPath = path.join(LOCAL_DEV_PATH, filePath);
        if (fs.existsSync(fullLocalPath)) {
            return fs.readFileSync(fullLocalPath, 'utf8');
        }
        return null; // Return null if file doesn't exist
    }

    const url = `${REPO_URL}/${filePath}`;
    return new Promise((resolve, reject) => {
        let data = '';
        https.get(url, (res) => {
            if (res.statusCode === 404) return resolve(null);
            if (res.statusCode !== 200) reject(new Error(`Failed ${url}: ${res.statusCode}`));
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

// Helper to fetch directory contents locally (simulating GitHub API for local dev)
function getLocalFilesRecursively(dirPath, baseDir) {
    let results = [];
    if (!fs.existsSync(dirPath)) return results;
    
    const list = fs.readdirSync(dirPath);
    list.forEach(file => {
        file = path.join(dirPath, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(getLocalFilesRecursively(file, baseDir));
        } else { 
            results.push(path.relative(baseDir, file).replace(/\\/g, '/'));
        }
    });
    return results;
}

// Minimal GitHub API abstraction to list files in a directory
async function listGithubFiles(repoPath) {
    const url = `https://api.github.com/repos/AgentSkills/AgentSkills/contents/.agents/${repoPath}`;
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

async function gatherSkillFiles(skillPath, useLocal) {
    const files = { skill: null, references: [], scripts: [] };
    
    // 1. Fetch SKILL.md
    files.skill = await fetchFileContent(`skills/${skillPath}/SKILL.md`, useLocal);
    
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
        const refFiles = await listGithubFiles(`skills/${skillPath}/references`);
        for (const f of refFiles) {
            const content = await fetchFileContent(`skills/${skillPath}/references/${f}`, false);
            if (content) files.references.push({ name: f, content });
        }
        
        const scriptFiles = await listGithubFiles(`skills/${skillPath}/scripts`);
        for (const f of scriptFiles) {
            const content = await fetchFileContent(`skills/${skillPath}/scripts/${f}`, false);
            if (content) files.scripts.push({ name: f, content });
        }
    }
    
    return files;
}

async function installAgent(agentName, assistant, useLocal) {
    const targetDir = ASSISTANT_PATHS[assistant];
    if (!targetDir) {
        console.error(chalk.red(`❌ Unsupported AI assistant: ${assistant}`));
        return;
    }

    const fullTargetDir = path.join(process.cwd(), targetDir);
    console.log(chalk.blue(`\n🚀 Initializing AgentSkills for ${chalk.bold(assistant)}...`));
    console.log(chalk.magenta(`🛡️  Targeting Agent Persona: ${chalk.bold(agentName)}`));
    
    // Fetch Agent file
    const agentContent = await fetchFileContent(`agents/${agentName}.md`, useLocal);
    if (!agentContent) {
        console.error(chalk.red(`❌ Agent persona '${agentName}' not found.`));
        return;
    }
    
    ensureDirSync(fullTargetDir);
    
    const { skills, mdContent: pureAgentMd } = parseFrontmatter(agentContent);
    console.log(chalk.gray(`📦 Found ${skills.length} dependency skills to resolve.`));
    
    const skillPayloads = [];
    for (const skill of skills) {
        console.log(chalk.yellow(`   ↳ Resolving skill: ${skill}...`));
        const payload = await gatherSkillFiles(skill, useLocal);
        skillPayloads.push({ name: skill, ...payload });
    }
    
    // Global Rules
    const globalRules = await fetchFileContent(`global-rules.md`, useLocal);
    
    // Workflows (fetch all for now if available locally or define standard ones)
    
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
        fs.writeFileSync(path.join(fullTargetDir, `${agentName}-instructions.md`), bundle);
        console.log(chalk.green(`✅ Generated monolithic bundle for ${assistant}.`));
    } 
    else if (assistant === 'claude' || assistant === 'kiro' || assistant === 'antigravity') {
        // FOLDER BUNDLE
        const agentDest = path.join(fullTargetDir, `agents`);
        ensureDirSync(agentDest);
        fs.writeFileSync(path.join(agentDest, `${agentName}.md`), pureAgentMd);
        
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
        console.log(chalk.green(`✅ Extracted folders and scripts for ${assistant}.`));
    }
    else {
        // CURSOR / WINDSURF (.mdc or flat structure)
        const isCursor = assistant === 'cursor';
        const ext = isCursor ? '.mdc' : '.md';
        
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
        
        console.log(chalk.green(`✅ Packed Agent and Skills into ${agentName}${ext}`));
    }
    
    console.log(chalk.blue.bold(`\n🎉 Successfully installed ${agentName} for ${assistant}!`));
}

async function run() {
    await loadESM();

    program
      .name('agentskills')
      .description('CLI to seamlessly install Universal Agent Roles & Skills into your AI assistant.')
      .version('2.0.0');

    program.command('init')
      .description('Initialize an Agent Persona for a specific AI assistant')
      .requiredOption('--agent <name>', 'Specify the Agent Persona (e.g., senior-backend, code-auditor)')
      .option('-a, --ai <platform>', `Specify the AI assistant (${Object.keys(ASSISTANT_PATHS).join(', ')})`)
      .option('--local', 'Use local files instead of downloading from GitHub (for development)')
      .action(async (options) => {
          let assistant = options.ai;
          let agent = options.agent.toLowerCase();

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

          if (assistant === 'all') {
              const common = ['cursor', 'claude', 'copilot'];
              for(const a of common) {
                  await installAgent(agent, a, options.local);
              }
          } else {
              await installAgent(agent, assistant, options.local);
          }
      });

    program.parse(process.argv);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
