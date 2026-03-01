# neonbx

CLI for switching between [Neon](https://neon.tech) Postgres database branches by updating local `.env` connection strings.

## Install

```bash
npm i -g neonbx
```

## Quick Start

```bash
neonbx init      # authenticate + configure
neonbx list      # see your Neon branches
neonbx switch    # pick a branch to switch to
neonbx sync      # auto-switch to match your git branch
```

## Setup

Run `neonbx init` to authenticate and configure your project. It opens a browser for Neon OAuth — no API keys to copy-paste or store in files.

The wizard is re-runnable and pre-fills current values so you can update individual settings.

```
┌  neonbx — Neon Branch Navigator
│
◇  Opening browser for Neon authentication...
│  Authenticated with Neon.
│
◆  Neon Project ID
│  > ep-cool-darkness-123456
│
◆  Path to your .env file (for DB URLs)
│  > .env.local
│
◆  Pooled database URL env key
│  > DATABASE_URL
│
◆  Unpooled database URL env key
│  > DATABASE_URL_UNPOOLED
│
◆  Default DB branch for git `main`
│  > main
│
└  You're all set! Run `neonbx list` to see your branches.
```

## Commands

### `neonbx init`

Interactive setup wizard. Authenticates with Neon via OAuth, then configures your project ID, env file path, and database URL keys.

### `neonbx list`

List all branches in your Neon project.

### `neonbx current`

Show which Neon branch your current `DATABASE_URL` points to.

### `neonbx switch [branch]`

Switch to a different branch. Opens an interactive picker if no branch name is provided. Asks for confirmation when switching to the primary branch.

### `neonbx sync`

Matches your current git branch to a Neon branch and switches to it. If you're on `main` or `master`, it uses your configured default branch.

### `neonbx config show`

Display current configuration and auth status.

### `neonbx config set <key> <value>`

Update a single config value. Valid keys: `projectId`, `envFilePath`, `pooledKey`, `unpooledKey`, `defaultBranch`.

### `neonbx config reset`

Clear all configuration (with confirmation prompt).

## Authentication

neonbx uses Neon's OAuth flow (via `neonctl auth`) — your credentials are stored securely in `~/.config/neonctl/credentials.json` with no API keys in your project files. Tokens are automatically refreshed when they expire.

## Requirements

- Node.js >= 18
- A [Neon](https://neon.tech) account

## License

MIT
