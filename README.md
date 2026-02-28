# neonbx

CLI for switching between [Neon](https://neon.tech) Postgres database branches by updating local `.env` connection strings.

## Install

```bash
npm i -g neonbx
```

## Quick Start

```bash
neonbx init      # interactive setup wizard
neonbx list      # see your Neon branches
neonbx switch    # pick a branch to switch to
neonbx sync      # auto-switch to match your git branch
```

## Setup

Run `neonbx init` to configure your project. The wizard is re-runnable — it pre-fills current values so you can update individual settings.

```
┌  neonbx — Neon Branch Navigator
│
◆  Neon Project ID
│  > ep-cool-darkness-123456
│
◆  Neon API Key
│  > ••••••••••••••••
│
◆  Where should we store your secrets?
│  ● .env.local (recommended — gitignored by default)
│  ○ .env
│  ○ System Keychain (macOS Keychain)
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
└  Config saved! Run `neonbx list` to see your branches.
```

## Commands

### `neonbx init`

Interactive setup wizard. Configures your Neon project ID, API key, secret storage location, env file path, and database URL keys.

### `neonbx list`

List all branches in your Neon project.

### `neonbx current`

Show which Neon branch your current `DATABASE_URL` points to.

### `neonbx switch [branch]`

Switch to a different branch. Opens an interactive picker if no branch name is provided. Asks for confirmation when switching to the primary branch.

### `neonbx sync`

Matches your current git branch to a Neon branch and switches to it. If you're on `main` or `master`, it uses your configured default branch.

### `neonbx config show`

Display current configuration (API key is masked).

### `neonbx config set <key> <value>`

Update a single config value. Valid keys: `projectId`, `apiKey`, `secretStorage`, `envFilePath`, `pooledKey`, `unpooledKey`, `defaultBranch`.

### `neonbx config reset`

Clear all configuration (with confirmation prompt).

## Secret Storage

During setup you choose where your Neon API key and project ID are stored:

| Option | Description |
|---|---|
| `.env.local` | Gitignored by default in Next.js, Vite, etc. **(recommended)** |
| `.env` | Simple, traditional approach |
| System Keychain | macOS Keychain — no secrets in files at all |

## Requirements

- Node.js >= 18
- A [Neon](https://neon.tech) account with an API key

## License

MIT
