---
name: rtk
description: Token-optimized shell command proxy guidance for Codex CLI. Use when running shell commands in environments where `rtk` is available and command output should be filtered or summarized to reduce token usage.
---

# RTK

Use `rtk` as the default prefix for shell commands when it is available in the environment. It proxies commands and filters output to reduce token usage.

## Command Pattern

Prefix normal shell commands with `rtk`:

```bash
rtk git status
rtk cargo test
rtk npm run build
rtk pytest -q
```

Use `rtk proxy` when raw, unfiltered output is required:

```bash
rtk proxy <command>
```

## Meta Commands

Use these commands to inspect RTK behavior:

```bash
rtk gain
rtk gain --history
rtk --version
which rtk
```

## Operating Rules

1. Prefer `rtk <command>` for routine shell commands.
2. Use `rtk proxy <command>` only when filtered output would hide important evidence.
3. Do not use `rtk` if it is unavailable or if the command must run exactly as written for compatibility.
4. Report verification results from the actual command output, not from assumptions.
