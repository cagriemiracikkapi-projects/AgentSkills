#!/bin/bash
# AI Agent Skills Installer
# Run this script at the root of any new project to install the AI agent rules

REPO_URL="https://raw.githubusercontent.com/<YOUR_GITHUB_USERNAME>/AgentSkills/main"
TARGET_DIR=".agents"

echo "Downloading Global Rules..."
curl -s "$REPO_URL/.agents/global-rules.md" -o "$TARGET_DIR/global-rules.md" --create-dirs

echo "Downloading Roles..."
curl -s "$REPO_URL/.agents/roles/auditor.md" -o "$TARGET_DIR/roles/auditor.md" --create-dirs
curl -s "$REPO_URL/.agents/roles/frontend.md" -o "$TARGET_DIR/roles/frontend.md" --create-dirs
curl -s "$REPO_URL/.agents/roles/backend.md" -o "$TARGET_DIR/roles/backend.md" --create-dirs
curl -s "$REPO_URL/.agents/roles/devops.md" -o "$TARGET_DIR/roles/devops.md" --create-dirs
curl -s "$REPO_URL/.agents/roles/database.md" -o "$TARGET_DIR/roles/database.md" --create-dirs

echo "Downloading Workflows..."
curl -s "$REPO_URL/.agents/workflows/audit.md" -o "$TARGET_DIR/workflows/audit.md" --create-dirs
curl -s "$REPO_URL/.agents/workflows/frontend.md" -o "$TARGET_DIR/workflows/frontend.md" --create-dirs
curl -s "$REPO_URL/.agents/workflows/backend.md" -o "$TARGET_DIR/workflows/backend.md" --create-dirs
curl -s "$REPO_URL/.agents/workflows/commit.md" -o "$TARGET_DIR/workflows/commit.md" --create-dirs

echo "AI Agent Rules successfully installed!"
