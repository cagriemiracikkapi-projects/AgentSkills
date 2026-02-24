#!/bin/bash
# AI Agent Skills Installer
# Run this script at the root of any new project to install the AI agent rules

set -euo pipefail

REPO_URL="https://raw.githubusercontent.com/cagriemiracikkapi-projects/AgentSkills/main"
TARGET_DIR=".agents"

download_required() {
  local source="$1"
  local target="$2"
  if ! curl -fsS "$REPO_URL/$source" -o "$target" --create-dirs; then
    echo "ERROR: Failed to download required file: $source" >&2
    exit 1
  fi
}

download_optional() {
  local source="$1"
  local target="$2"
  if ! curl -fsS "$REPO_URL/$source" -o "$target" --create-dirs; then
    echo "WARN: Optional file not found: $source" >&2
  fi
}

echo "Downloading Global Rules..."
download_required ".agents/global-rules.md" "$TARGET_DIR/global-rules.md"

echo "Downloading Agents (Personas)..."
download_required ".agents/agents/code-auditor.md" "$TARGET_DIR/agents/code-auditor.md"
download_required ".agents/agents/devops-engineer.md" "$TARGET_DIR/agents/devops-engineer.md"
download_required ".agents/agents/game-architect.md" "$TARGET_DIR/agents/game-architect.md"
download_required ".agents/agents/qa-automation.md" "$TARGET_DIR/agents/qa-automation.md"
download_required ".agents/agents/senior-backend.md" "$TARGET_DIR/agents/senior-backend.md"
download_required ".agents/agents/senior-frontend.md" "$TARGET_DIR/agents/senior-frontend.md"
download_optional ".agents/agents/prompt-engineer.md" "$TARGET_DIR/agents/prompt-engineer.md"
download_optional ".agents/agents/ui-ux-designer.md" "$TARGET_DIR/agents/ui-ux-designer.md"

echo "Downloading Workflows..."
download_required ".agents/workflows/audit.md" "$TARGET_DIR/workflows/audit.md"
download_required ".agents/workflows/frontend.md" "$TARGET_DIR/workflows/frontend.md"
download_required ".agents/workflows/commit.md" "$TARGET_DIR/workflows/commit.md"
download_required ".agents/workflows/manage-roles.md" "$TARGET_DIR/workflows/manage-roles.md"
download_required ".agents/workflows/test.md" "$TARGET_DIR/workflows/test.md"
download_optional ".agents/workflows/backend.md" "$TARGET_DIR/workflows/backend.md"

echo "AI Agent Rules successfully installed!"
