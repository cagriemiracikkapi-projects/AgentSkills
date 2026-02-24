$ErrorActionPreference = "Stop"

$GITHUB_USER = "YOUR_GITHUB_USERNAME"
$REPO_URL = "https://raw.githubusercontent.com/$GITHUB_USER/AgentSkills/main"
$TARGET_DIR = ".agents"

Write-Host "Creating Directories..." -ForegroundColor Cyan
if (!(Test-Path "$TARGET_DIR\roles")) { New-Item -ItemType Directory -Force -Path "$TARGET_DIR\roles" | Out-Null }
if (!(Test-Path "$TARGET_DIR\workflows")) { New-Item -ItemType Directory -Force -Path "$TARGET_DIR\workflows" | Out-Null }

Write-Host "Downloading Global Rules..." -ForegroundColor Cyan
Invoke-WebRequest -Uri "$REPO_URL/.agents/global-rules.md" -OutFile "$TARGET_DIR\global-rules.md"

Write-Host "Downloading Roles..." -ForegroundColor Cyan
Invoke-WebRequest -Uri "$REPO_URL/.agents/roles/auditor.md" -OutFile "$TARGET_DIR\roles\auditor.md"
Invoke-WebRequest -Uri "$REPO_URL/.agents/roles/frontend.md" -OutFile "$TARGET_DIR\roles\frontend.md"
Invoke-WebRequest -Uri "$REPO_URL/.agents/roles/backend.md" -OutFile "$TARGET_DIR\roles\backend.md"
Invoke-WebRequest -Uri "$REPO_URL/.agents/roles/devops.md" -OutFile "$TARGET_DIR\roles\devops.md"
Invoke-WebRequest -Uri "$REPO_URL/.agents/roles/database.md" -OutFile "$TARGET_DIR\roles\database.md"

Write-Host "Downloading Workflows..." -ForegroundColor Cyan
Invoke-WebRequest -Uri "$REPO_URL/.agents/workflows/audit.md" -OutFile "$TARGET_DIR\workflows\audit.md"
Invoke-WebRequest -Uri "$REPO_URL/.agents/workflows/frontend.md" -OutFile "$TARGET_DIR\workflows\frontend.md"
Invoke-WebRequest -Uri "$REPO_URL/.agents/workflows/backend.md" -OutFile "$TARGET_DIR\workflows\backend.md"
Invoke-WebRequest -Uri "$REPO_URL/.agents/workflows/commit.md" -OutFile "$TARGET_DIR\workflows\commit.md"

Write-Host "✅ AI Agent Rules successfully installed!" -ForegroundColor Green
