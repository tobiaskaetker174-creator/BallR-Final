# Security Policy

## Multi-Agent Repository

This repository is actively developed by multiple AI agents:

- **Claude Code** — Local coding assistant (Tobias's laptop)
- **OpenClaw** — Remote AI agent running on a hardened VPS

Because AI agents can be targets for prompt injection attacks, this repo has automated security measures in place.

## Injection Scanner

Every push and pull request is automatically scanned by `.github/workflows/injection-scanner.yml` for known prompt injection patterns.

### Scanned Patterns

The scanner detects (case-insensitive):

| Category | Patterns |
|----------|----------|
| Instruction Override | "ignore previous", "ignore above", "ignore all", "disregard", "forget your instructions", "new instructions", "override" |
| Role Manipulation | "you are now", "act as", "pretend you", "from now on you", "speaking as admin" |
| System Probing | "system prompt", "reveal your", "show me your prompt", "what are your instructions" |
| Security Bypass | "jailbreak", "bypass", "do not follow", "ignore safety", "ignore security" |
| Direct Addressing | "claude please", "hey claude", "hey assistant" |
| Code Execution | "eval(", "execute this", "base64 decode" |
| Instruction Markers | "IMPORTANT:", "INSTRUCTION:" |

### Scanned File Types

`.ts`, `.tsx`, `.js`, `.jsx`, `.md`, `.json`, `.html`, `.css`, `.yml`, `.yaml`, `.txt`, `.env.example`, `.sh`, `.py`

### False Positives

If a legitimate commit triggers the scanner:

1. The workflow will fail and send a Telegram alert
2. Review the flagged patterns manually
3. If it's a false positive, push with the commit message tag `[skip-scan]` — **Note: this does NOT actually skip the scan, it just documents intent. The scan always runs.**
4. Alternatively, add the specific file to the exclusion list in the workflow

## Unicode Sanitization

A pre-commit hook (`.githooks/pre-commit`) automatically strips dangerous invisible Unicode characters from all committed files. These characters are known injection vectors:

- Zero-width spaces and joiners (U+200B–U+200F)
- Bidirectional text overrides (U+202A–U+202E)
- BOM markers (U+FEFF)
- Invisible operators (U+2060–U+2064)

## Setup for Contributors

After cloning, activate the pre-commit hooks:

```bash
git config core.hooksPath .githooks
```

## Reporting Security Issues

If you discover a security vulnerability or a successful prompt injection, contact Tobias directly via Telegram.
