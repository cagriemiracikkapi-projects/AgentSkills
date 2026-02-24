$ErrorActionPreference = "Stop"

$REPO_URL = "https://raw.githubusercontent.com/AgentSkills/AgentSkills/main"
$TARGET_DIR = ".agents"

function Download-RequiredFile {
    param (
        [string]$Source,
        [string]$Target
    )
    try {
        Invoke-WebRequest -Uri "$REPO_URL/$Source" -OutFile $Target
    }
    catch {
        Write-Error "Failed to download required file: $Source"
        exit 1
    }
}

function Download-OptionalFile {
    param (
        [string]$Source,
        [string]$Target
    )
    try {
        Invoke-WebRequest -Uri "$REPO_URL/$Source" -OutFile $Target
    }
    catch {
        Write-Warning "Optional file not found: $Source"
    }
}

Write-Host "Creating Directories..." -ForegroundColor Cyan
if (!(Test-Path "$TARGET_DIR\agents")) { New-Item -ItemType Directory -Force -Path "$TARGET_DIR\agents" | Out-Null }
if (!(Test-Path "$TARGET_DIR\workflows")) { New-Item -ItemType Directory -Force -Path "$TARGET_DIR\workflows" | Out-Null }

Write-Host "Downloading Global Rules..." -ForegroundColor Cyan
Download-RequiredFile ".agents/global-rules.md" "$TARGET_DIR\global-rules.md"

Write-Host "Downloading Agents (Personas)..." -ForegroundColor Cyan
Download-RequiredFile ".agents/agents/code-auditor.md" "$TARGET_DIR\agents\code-auditor.md"
Download-RequiredFile ".agents/agents/devops-engineer.md" "$TARGET_DIR\agents\devops-engineer.md"
Download-RequiredFile ".agents/agents/game-architect.md" "$TARGET_DIR\agents\game-architect.md"
Download-RequiredFile ".agents/agents/qa-automation.md" "$TARGET_DIR\agents\qa-automation.md"
Download-RequiredFile ".agents/agents/senior-backend.md" "$TARGET_DIR\agents\senior-backend.md"
Download-RequiredFile ".agents/agents/senior-frontend.md" "$TARGET_DIR\agents\senior-frontend.md"
Download-OptionalFile ".agents/agents/prompt-engineer.md" "$TARGET_DIR\agents\prompt-engineer.md"
Download-OptionalFile ".agents/agents/ui-ux-designer.md" "$TARGET_DIR\agents\ui-ux-designer.md"

Write-Host "Downloading Workflows..." -ForegroundColor Cyan
Download-RequiredFile ".agents/workflows/audit.md" "$TARGET_DIR\workflows\audit.md"
Download-RequiredFile ".agents/workflows/frontend.md" "$TARGET_DIR\workflows\frontend.md"
Download-RequiredFile ".agents/workflows/commit.md" "$TARGET_DIR\workflows\commit.md"
Download-RequiredFile ".agents/workflows/manage-roles.md" "$TARGET_DIR\workflows\manage-roles.md"
Download-RequiredFile ".agents/workflows/test.md" "$TARGET_DIR\workflows\test.md"
Download-OptionalFile ".agents/workflows/backend.md" "$TARGET_DIR\workflows\backend.md"

Write-Host "✅ AI Agent Rules successfully installed!" -ForegroundColor Green
