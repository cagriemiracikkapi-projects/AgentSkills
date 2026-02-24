# AgentSkills CLI

Official CLI package for AgentSkills.

## Install

### NPM (primary)
```bash
npm install -g @cagriemiracikkapi-projects/agentskills-cli
```

### GitHub fallback
```bash
npm install -g git+https://github.com/cagriemiracikkapi-projects/AgentSkills.git#main:cli
```

### Local fallback
```bash
git clone https://github.com/cagriemiracikkapi-projects/AgentSkills.git
cd AgentSkills/cli
npm install
npm link
```

## Usage
```bash
agentskills --help
agentskills init --agent senior-backend --ai cursor
agentskills init --domain game --ai copilot
```

Optional source overrides:
```bash
agentskills init --agent senior-backend --ai cursor --source-repo cagriemiracikkapi-projects/AgentSkills --source-branch main
```

Environment alternatives:
```bash
set AGENTSKILLS_REPO=cagriemiracikkapi-projects/AgentSkills
set AGENTSKILLS_BRANCH=main
```

## Publish
```bash
npm login
npm version patch
npm publish --access public
```

The CLI includes a `prepublishOnly` hook:
```bash
npm test && npm run validate:content
```
