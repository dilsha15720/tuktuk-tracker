#!/usr/bin/env bash
set -euo pipefail

# Usage:
# 1) Make executable: chmod +x scripts/create_and_push_repo.sh
# 2) Run (defaults to public repo named tuk-tracker-api under user dilsha15720):
#    GITHUB_USER=dilsha15720 REPO_NAME=tuk-tracker-api VISIBILITY=public ./scripts/create_and_push_repo.sh

GITHUB_USER=${GITHUB_USER:-dilsha15720}
REPO_NAME=${REPO_NAME:-tuk-tracker-api}
VISIBILITY=${VISIBILITY:-public} # public or private

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "Working in: $ROOT_DIR"

if ! command -v git >/dev/null 2>&1; then
  echo "git is not installed. Please install git and re-run." >&2
  exit 1
fi

# Initialize git repo if needed
if [ ! -d .git ]; then
  git init
  git checkout -b main || git branch -M main
fi

# Append safe .gitignore entries
touch .gitignore
grep -qxF "node_modules/" .gitignore || echo "node_modules/" >> .gitignore
grep -qxF ".env" .gitignore || echo ".env" >> .gitignore
grep -qxF "data/*.csv" .gitignore || echo "data/*.csv" >> .gitignore
grep -qxF ".vscode/" .gitignore || echo ".vscode/" >> .gitignore
grep -qxF "coverage/" .gitignore || echo "coverage/" >> .gitignore

if [ ! -f .env.example ] && [ -f .env ]; then
  echo "Creating .env.example from .env (sanitise before sharing)"
  cp .env .env.example
fi

git add -A
if git diff --cached --quiet; then
  echo "No changes to commit"
else
  git commit -m "chore: initial import — Tuk Tracker API" || true
fi

REMOTE_URL=""

if command -v gh >/dev/null 2>&1; then
  echo "gh CLI detected — creating repo on GitHub"
  # choose visibility flag
  if [ "$VISIBILITY" = "private" ]; then
    gh repo create "$GITHUB_USER/$REPO_NAME" --private --source=. --remote=origin --push
  else
    gh repo create "$GITHUB_USER/$REPO_NAME" --public --source=. --remote=origin --push
  fi
  REMOTE_URL=$(git remote get-url origin 2>/dev/null || true)
else
  echo "gh CLI not found. Please create the repository on GitHub.com (or install gh)."
  echo "After creating a repo, run one of the following (SSH or HTTPS):"
  echo "  git remote add origin git@github.com:${GITHUB_USER}/${REPO_NAME}.git"
  echo "  git remote add origin https://github.com/${GITHUB_USER}/${REPO_NAME}.git"
  echo "Then push with: git push -u origin main"
  exit 0
fi

echo "Remote set to: $REMOTE_URL"
echo "Pushed branch main to origin. Done."
