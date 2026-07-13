# Git Workflow — Release Candidate Tagging

## Overview

This document describes the workflow used when preparing and publishing a Release Candidate (RC).

The workflow extends the standard Pull Request workflow by adding release tagging steps.

---

## Important Rule

Before creating commits, branches, or pull requests, always verify the currently checked-out branch.

The repository intentionally ends every release workflow on:

```txt
main
```

Therefore, the next development branch must always be created explicitly.

Recommended verification:

```bash
git status
```

or

```bash
git branch --show-current
```

Never assume the current branch.

---

## Standard RC Workflow

### 1. Verify Current Branch

```bash
git status
```

Expected:

```txt
On branch main
```

---

### 2. Create RC Preparation Branch

Example:

```bash
git checkout -b chore/v0.1.0-rc.3
```

---

### 3. Implement Changes

Modify code, tests, RFCs, changelogs, or documentation required for the RC.

---

### 4. Stage Changes

```bash
git add -A
```

---

### 5. Create Commit

Example:

```bash
git commit -m "fix(core): resolve stage path expansion and defaults ordering"
```

---

### 6. Push Branch

```bash
git push -u origin chore/v0.1.0-rc.3
```

---

### 7. Create Pull Request

Open a Pull Request targeting:

```txt
main
```

Wait for validation and merge.

---

## Release Candidate Tagging

Once the Pull Request has been merged:

---

### 8. Checkout Main

```bash
git checkout main
```

---

### 9. Synchronize Main

```bash
git pull
```

Expected:

```txt
Your branch is up to date with 'origin/main'
```

The local repository must contain the merge commit before tagging.

---

### 10. Verify Repository State

```bash
git status
```

Expected:

```txt
On branch main
Your branch is up to date with 'origin/main'

nothing to commit, working tree clean
```

---

### 11. Create Release Candidate Tag

Example:

```bash
git tag -a v0.1.0-rc.3 -m "Release Candidate 3"
```

---

### 12. Publish Tag

```bash
git push origin v0.1.0-rc.3
```

---

### 13. Build Package

Generate release artifacts from the tagged commit.

Example:

```bash
pnpm pack
```

or any project-specific packaging command.

---

## Result

The final state is:

```txt
main
↓
merged PR
↓
tagged commit
↓
published RC
```

The repository remains on:

```txt
main
```

after tagging.

This is intentional and ensures the next development branch is always created explicitly.

---

## Next RC Cycle

When a new Release Candidate is required:

```bash
git status
git checkout -b chore/v0.1.0-rc.4
```

Never continue development directly from:

```txt
main
```

Always create a dedicated branch for the next RC cycle.
