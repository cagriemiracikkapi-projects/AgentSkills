#!/usr/bin/env node

const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

let chalk;
let inquirer;

const REPO_URL = 'https://raw.githubusercontent.com/AgentSkills/AgentSkills/main/.agents'; // Adjust this to the actual repo later
const LOCAL_DEV_PATH = path.resolve(__dirname, '../.agents'); // Path to test locally without downloading

const ASSISTANT_PATHS = {
    cursor: '.cursor/rules',
    windsurf: '.windsurf/rules',
    claude: '.claude/skills',
    gemini: '.gemini',
    antigravity: '.gemini/antigravity',
    copilot: '.github',
    roocode: '.roocode',
    trae: '.trae',
    continue: '.continue',
    all: 'all'
};

const FILES_TO_SYNC = [
    'global-rules.md',
    'roles/auditor.md',
    'roles/frontend.md',
    'roles/backend.md',
    'roles/devops.md',
    'roles/database.md',
    'workflows/audit.md',
    'workflows/frontend.md',
    'workflows/backend.md',
    'workflows/commit.md',
    'workflows/manage-roles.md'
];

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
        throw new Error(`Local file not found: ${fullLocalPath}`);
    }

    const url = `${REPO_URL}/${filePath}`;
    return new Promise((resolve, reject) => {
        let data = '';
        https.get(url, (res) => {
            if (res.statusCode !== 200) reject(new Error(`Failed ${url}: ${res.statusCode}`));
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function installForAssistant(assistant, useLocal) {
    const targetDir = ASSISTANT_PATHS[assistant];
    
    if (!targetDir) {
        console.error(chalk.red(`❌ Unsupported AI assistant: ${assistant}`));
        process.exit(1);
    }

    const fullTargetDir = path.join(process.cwd(), targetDir);
    console.log(chalk.blue(`\n🚀 Initializing AgentSkills for ${chalk.bold(assistant)}...`));
    console.log(chalk.gray(`📂 Target directory: ${fullTargetDir}\n`));

    ensureDirSync(fullTargetDir);

    let downloadedCount = 0;

    // GitHub Copilot prefers a single file usually
    if (assistant === 'copilot') {
        let consolidatedContent = "# AgentSkills System Rules\n\n";
        
        for (const file of FILES_TO_SYNC) {
           try{
             const content = await fetchFileContent(file, useLocal);
             consolidatedContent += `\n\n## Source: ${file}\n\n${content}`;
             console.log(chalk.green(`✅ Loaded: ${file}`));
             downloadedCount++;
           } catch(e) {
               console.error(chalk.red(`❌ Error fetching ${file}`));
           }
        }
        
        fs.writeFileSync(path.join(fullTargetDir, 'copilot-instructions.md'), consolidatedContent);

    } else {
        // Cursor and windsurf prefer flat files in their rules directories
        const isFlat = assistant === 'cursor' || assistant === 'windsurf';

        for (const file of FILES_TO_SYNC) {
            let destFileName = file;
            
            if (isFlat) {
                 destFileName = file.replace(/\//g, '-');
                 if(assistant === 'cursor') {
                     destFileName = destFileName.replace('.md', '.mdc');
                 }
            }

            const destFile = path.join(fullTargetDir, destFileName);
            const destDir = path.dirname(destFile);
            ensureDirSync(destDir);

            try {
                const content = await fetchFileContent(file, useLocal);
                fs.writeFileSync(destFile, content);
                console.log(chalk.green(`✅ Installed: ${path.basename(destFile)}`));
                downloadedCount++;
            } catch (error) {
                console.error(chalk.red(`❌ Failed to install ${file}: ${error.message}`));
            }
        }
    }

    console.log(chalk.blue.bold(`\n🎉 Successfully installed ${downloadedCount} agent skills for ${assistant}!`));
}

async function run() {
    await loadESM();

    program
      .name('agentskills')
      .description('CLI to seamlessly install AgentSkills architecture into your IDE or CLI AI assistant.')
      .version('1.0.0');

    program.command('init')
      .description('Initialize AgentSkills for a specific AI assistant')
      .option('-a, --ai <platform>', `Specify the AI assistant (${Object.keys(ASSISTANT_PATHS).join(', ')})`)
      .option('--local', 'Use local files instead of downloading from GitHub (for development)')
      .action(async (options) => {
          let assistant = options.ai;

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
                  await installForAssistant(a, options.local);
              }
          } else {
              await installForAssistant(assistant, options.local);
          }
      });

    program.parse(process.argv);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
