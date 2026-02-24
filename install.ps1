$ErrorActionPreference = "Stop"

$GITHUB_USER = "YOUR_GITHUB_USERNAME"
$REPO_URL = "https://raw.githubusercontent.com/$GITHUB_USER/AgentSkills/main"
$TARGET_DIR = ".agents"

Write-Host "Creating Directories..." -ForegroundColor Cyan
if (!(Test-Path "$TARGET_DIR\agents")) { New-Item -ItemType Directory -Force -Path "$TARGET_DIR\agents" | Out-Null }
if (!(Test-Path "$TARGET_DIR\workflows")) { New-Item -ItemType Directory -Force -Path "$TARGET_DIR\workflows" | Out-Null }

Write-Host "Downloading Global Rules..." -ForegroundColor Cyan
Invoke-WebRequest -Uri "$REPO_URL/.agents/global-rules.md" -OutFile "$TARGET_DIR\global-rules.md"

Write-Host "Downloading Agents (Personas)..." -ForegroundColor Cyan
Invoke-WebRequest -Uri "$REPO_URL/.agents/agents/code-auditor.md" -OutFile "$TARGET_DIR\agents\code-auditor.md"
Invoke-WebRequest -Uri "$REPO_URL/.agents/agents/devops-engineer.md" -OutFile "$TARGET_DIR\agents\devops-engineer.md"
Invoke-WebRequest -Uri "$REPO_URL/.agents/agents/game-architect.md" -OutFile "$TARGET_DIR\agents\game-architect.md"
Invoke-WebRequest -Uri "$REPO_URL/.agents/agents/prompt-engineer.md" -OutFile "$TARGET_DIR\agents\prompt-engineer.md"
Invoke-WebRequest -Uri "$REPO_URL/.agents/agents/qa-automation.md" -OutFile "$TARGET_DIR\agents\qa-automation.md"
Invoke-WebRequest -Uri "$REPO_URL/.agents/agents/senior-backend.md" -OutFile "$TARGET_DIR\agents\senior-backend.md"
Invoke-WebRequest -Uri "$REPO_URL/.agents/agents/senior-frontend.md" -OutFile "$TARGET_DIR\agents\senior-frontend.md"
Invoke-WebRequest -Uri "$REPO_URL/.agents/agents/ui-ux-designer.md" -OutFile "$TARGET_DIR\agents\ui-ux-designer.md"

Write-Host "Downloading Workflows..." -ForegroundColor Cyan
Invoke-WebRequest -Uri "$REPO_URL/.agents/workflows/audit.md" -OutFile "$TARGET_DIR\workflows\audit.md"
Invoke-WebRequest -Uri "$REPO_URL/.agents/workflows/frontend.md" -OutFile "$TARGET_DIR\workflows\frontend.md"
Invoke-WebRequest -Uri "$REPO_URL/.agents/workflows/backend.md" -OutFile "$TARGET_DIR\workflows\backend.md"
Invoke-WebRequest -Uri "$REPO_URL/.agents/workflows/commit.md" -OutFile "$TARGET_DIR\workflows\commit.md"
Invoke-WebRequest -Uri "$REPO_URL/.agents/workflows/manage-roles.md" -OutFile "$TARGET_DIR\workflows\manage-roles.md"
Invoke-WebRequest -Uri "$REPO_URL/.agents/workflows/test.md" -OutFile "$TARGET_DIR\workflows\test.md"

Write-Host "✅ AI Agent Rules successfully installed!" -ForegroundColor Green
