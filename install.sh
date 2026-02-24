#!/bin/bash
# AI Agent Skills Installer
# Run this script at the root of any new project to install the AI agent rules

REPO_URL="https://raw.githubusercontent.com/<YOUR_GITHUB_USERNAME>/AgentSkills/main"
TARGET_DIR=".agents"

echo "Downloading Global Rules..."
curl -s "$REPO_URL/.agents/global-rules.md" -o "$TARGET_DIR/global-rules.md" --create-dirs

echo "Downloading Agents (Personas)..."
curl -s "$REPO_URL/.agents/agents/code-auditor.md" -o "$TARGET_DIR/agents/code-auditor.md" --create-dirs
curl -s "$REPO_URL/.agents/agents/devops-engineer.md" -o "$TARGET_DIR/agents/devops-engineer.md" --create-dirs
curl -s "$REPO_URL/.agents/agents/game-architect.md" -o "$TARGET_DIR/agents/game-architect.md" --create-dirs
curl -s "$REPO_URL/.agents/agents/prompt-engineer.md" -o "$TARGET_DIR/agents/prompt-engineer.md" --create-dirs
curl -s "$REPO_URL/.agents/agents/qa-automation.md" -o "$TARGET_DIR/agents/qa-automation.md" --create-dirs
curl -s "$REPO_URL/.agents/agents/senior-backend.md" -o "$TARGET_DIR/agents/senior-backend.md" --create-dirs
curl -s "$REPO_URL/.agents/agents/senior-frontend.md" -o "$TARGET_DIR/agents/senior-frontend.md" --create-dirs
curl -s "$REPO_URL/.agents/agents/ui-ux-designer.md" -o "$TARGET_DIR/agents/ui-ux-designer.md" --create-dirs

echo "Downloading Workflows..."
curl -s "$REPO_URL/.agents/workflows/audit.md" -o "$TARGET_DIR/workflows/audit.md" --create-dirs
curl -s "$REPO_URL/.agents/workflows/frontend.md" -o "$TARGET_DIR/workflows/frontend.md" --create-dirs
curl -s "$REPO_URL/.agents/workflows/backend.md" -o "$TARGET_DIR/workflows/backend.md" --create-dirs
curl -s "$REPO_URL/.agents/workflows/commit.md" -o "$TARGET_DIR/workflows/commit.md" --create-dirs
curl -s "$REPO_URL/.agents/workflows/manage-roles.md" -o "$TARGET_DIR/workflows/manage-roles.md" --create-dirs
curl -s "$REPO_URL/.agents/workflows/test.md" -o "$TARGET_DIR/workflows/test.md" --create-dirs

echo "AI Agent Rules successfully installed!"
