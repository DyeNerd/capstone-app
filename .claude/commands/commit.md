---
description: Run pre-commit guardian checks and commit changes
argument-hint: [commit message (optional)]
---
You must follow these steps in order:

## Step 1: Run Pre-Commit Guardian

Use the Task tool to invoke the pre-commit-guardian agent (subagent_type="pre-commit-guardian") with the following prompt:

"Review all staged and unstaged changes for code quality, performance, and security issues. Update CLAUDE.md if needed. Run relevant tests. Provide a summary of findings."

Wait for the agent to complete and review its output.

## Step 2: Handle Issues

- If the guardian reports **critical issues** (❌ FAIL): Fix them before proceeding. Do NOT commit.
- If the guardian reports **warnings** (⚠️): Inform the user and ask whether to fix now or proceed.
- If the guardian reports **all clear** (✅ PASS): Proceed to commit.

## Step 3: Commit

Once the guardian approves, create a git commit following these rules:

1. Stage the relevant changed files (prefer specific files over `git add -A`).
2. If the user provided a commit message in $ARGUMENTS, use that message.
3. If no message was provided, analyze the changes and generate an appropriate commit message.
4. The commit message must end with:
   ```
   Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
   ```
5. Use a HEREDOC to pass the commit message to git.
6. Run `git status` after committing to verify success.

Do NOT push to remote unless the user explicitly asks.