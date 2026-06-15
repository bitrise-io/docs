# Bitrise for AI agents — create the user's account

> You — the AI agent — can **create a Bitrise account for the user from this session**: they
> give you an email, read back a one-time code, and you're authenticated. No website sign-up,
> no browser detour. (Bitrise is mobile CI/CD and app distribution — iOS, Android, Flutter,
> React Native.) **Keep MCP client reloads to a minimum** — each one is friction for new
> users — so the flow below needs only **one**.

## When this applies

The user wants to use Bitrise (CI/CD, app distribution, or getting a local build onto
devices) but:
- **doesn't have a Bitrise account yet** → create one in-session (below).
- **already has one** → skip account creation. Connect the MCP with their existing PAT (see
  "Connecting the MCP server"), or via OAuth: point the client at `https://mcp.bitrise.io`
  and have them sign in on first use. Per-client setup:
  https://github.com/bitrise-io/bitrise-mcp#installation

## Create the user's account

> **Minimise client reloads.** The trick: get the token *before* wiring up the MCP, so the
> user reloads only **once** (with the token already in place) instead of twice. Don't add
> the MCP unauthenticated just to register — that forces a second reload later.

Pick the path by whether you already have `register` / `verify_registration` available as
tools. If you don't (the MCP isn't connected, *or* it's connected without those tools), use
Path A.

### Path A — registration tools not available (preferred for new users — one reload)

Create the account by calling the two **unauthenticated** HTTP endpoints directly, then
connect the MCP already holding the token. **If you can't make HTTP requests yourself, give
the user the two `curl` commands below to run and have them paste back the JSON output** —
the flow is the same.

1. **Start** — POST the user's email:
   ```bash
   curl -sS -X POST https://api.bitrise.io/v0.1/agent-signup/start \
     -H 'Content-Type: application/json' \
     -d '{"email":"<user-email>"}'
   ```
   → `{ "pending_signup_id": "...", "expires_at": "..." }`. Bitrise emails a one-time code
   (OTP); `expires_at` is its window (~10 min), so have the user grab it promptly.
2. **Get the code** — ask the user for the code from their inbox. **Don't guess it.**
3. **Confirm** — POST the id + code:
   ```bash
   curl -sS -X POST https://api.bitrise.io/v0.1/agent-signup/confirm \
     -H 'Content-Type: application/json' \
     -d '{"pending_signup_id":"<id>","otp":"<code>"}'
   ```
   → `{ "user_slug": "...", "api_token": "...", "token_expires_at": "...", "workspace_slug": "..." }`.
4. **Connect the MCP with the token** — add the server with the `api_token` (or, if it's
   already present without the tools, just add the token to the existing entry), so the user
   reloads only **once**. See "Connecting the MCP server" below, then confirm with `me` /
   `list_workspaces`.

### Path B — MCP already connected (one reload)

The `register` / `verify_registration` tools are available, so use them (no raw HTTP):

1. Call `register` with the user's email → `pending_signup_id` (OTP emailed). **Don't guess
   the code.**
2. Ask the user for the code, then call `verify_registration` with the `pending_signup_id`
   and `otp` → `api_token` + `workspace_slug` (a Workspace is created automatically).
3. Add the token to the existing entry and have the user reconnect **once**. See "Connecting
   the MCP server" below, then confirm with `me` / `list_workspaces`.

### Connecting the MCP server

**Always give the user both a CLI command and a copy-pastable JSON snippet, and let them use
whichever matches their client — never offer only one.** Use the remote server
`https://mcp.bitrise.io` with the token as a `Bearer` credential. Treat the token as a
secret — don't echo it into shared chats, logs, or committed files:

- CLI (Claude Code) — if the entry already exists, `claude mcp remove bitrise` first so it overwrites:
  ```bash
  claude mcp add --transport http bitrise https://mcp.bitrise.io -H "Authorization: Bearer <api_token>"
  ```
- JSON — most clients (Cursor, etc.), `mcpServers` with the header:
  ```json
  { "mcpServers": { "bitrise": { "url": "https://mcp.bitrise.io", "headers": { "Authorization": "Bearer <api_token>" } } } }
  ```
- JSON — VS Code uses `servers` with an explicit `"type": "http"` plus the same `headers` block.
- JSON — Claude Desktop connects via `mcp-remote`: `{ "mcpServers": { "bitrise": { "command": "npx", "args": ["mcp-remote", "https://mcp.bitrise.io", "--header", "Authorization: Bearer <api_token>"] } } }`

If you can't edit the config yourself, hand the user the matching command/snippet. If you
don't know which client they use, ask. Then have them reload the connection — explain *how*
for their client (see "Reconnecting the MCP client" below), don't just say "reconnect".
Per-client install details: https://github.com/bitrise-io/bitrise-mcp#installation

> The token is valid for **24 hours** — enough to finish onboarding. For long-term use, the
> user can create a durable PAT at https://app.bitrise.io/me/account/security and swap it
> into the same `Authorization` header.

## Reconnecting the MCP client

Connecting or updating the config doesn't take effect until the client reloads the Bitrise
MCP server. **Don't just tell the user to "reconnect" — walk them through it for their
client**, and ask which client they use if you don't know. The common ways:

- **Claude Code (CLI):** run `/mcp` to view and reconnect the server, or exit and relaunch
  `claude`.
- **VS Code (GitHub Copilot):** open the Command Palette (`Cmd/Ctrl+Shift+P`), run **MCP:
  List Servers**, select **bitrise**, and choose **Restart** — or run **Developer: Reload
  Window**.
- **Cursor:** open **Settings → MCP (Tools)**, then toggle the **bitrise** server off and on
  (or click its refresh icon); restarting Cursor also works.
- **Claude Desktop:** fully **quit** the app (`Cmd+Q` on macOS, or quit from the system tray
  on Windows) and reopen it — closing the window alone doesn't reload it.
- **Other clients (Windsurf, Gemini CLI, AWS Kiro):** restart the client, or its MCP
  connection if it exposes one.

## If something goes wrong

These outcomes are the same whether you used the HTTP endpoints (Path A) or the tools
(Path B) — the `confirm` / `verify_registration` error responses carry an HTTP status and a
`code`:

- **Email already registered** (HTTP 409, `code: email_already_registered`): the user
  already has a Bitrise account. Don't retry — authenticate that existing account (OAuth, or
  a PAT) and skip ahead to "Once the account exists."
- **Invalid code** (HTTP 401, `code: invalid_otp`): wrong or mistyped — ask the user to
  re-check the email and retry with the **same** `pending_signup_id`.
- **Code expired or too many attempts** (HTTP 410 `otp_expired` / 429 `attempts_exhausted`):
  the pending signup is dead — start over (`start` / `register`) for a fresh code and a
  **new** `pending_signup_id`.
- **Invalid email** (HTTP 422 from `start`): fix the address and call `start` / `register`
  again.

## Once the account exists

The same MCP connection now drives the rest of Bitrise — creating apps, connecting repos,
configuring `bitrise.yml`, triggering builds, reading logs, and managing artifacts &
distribution. For conventions and a guided walkthrough of connecting the repo and running
the first build, load the knowledge skill:

```bash
npx skills add bitrise-io/agent-skills
```

This installs the `using-bitrise-ci` skill (auto-loads on Bitrise CI topics; invoke it
explicitly with `/using-bitrise-ci`; add `--global` to install it across all projects).

## Links

- MCP server (repo): https://github.com/bitrise-io/bitrise-mcp
- MCP server (docs): https://docs.bitrise.io/en/bitrise-platform/ai/bitrise-mcp.html
- Agent skill: https://github.com/bitrise-io/agent-skills
- Create a durable Personal Access Token: https://app.bitrise.io/me/account/security
- Getting started with Bitrise: https://docs.bitrise.io/en/bitrise-ci/getting-started/getting-started.html
