# Bitrise for AI agents — create the user's account

> Bitrise is mobile-focused CI/CD and app distribution (iOS & Android, plus Flutter &
> React Native). Before a user can build, test, sign, or distribute an app on Bitrise, they
> need an account. You — the AI agent — can **create that account from this session** through
> the Bitrise MCP server: the user gives you an email, reads back a one-time code, and you're
> authenticated. No website sign-up, no browser detour.

## When this applies

The user wants to use Bitrise (CI/CD, app distribution, or getting a local build onto
devices) but:
- **doesn't have a Bitrise account yet** → create one in-session (below), or
- **already has one** → just authenticate the MCP connection (OAuth, or a PAT) and you're
  done.

## Create an account via the MCP

**Step 1 — Connect the MCP server, unauthenticated.** A brand-new user has no Bitrise MCP
entry in their client config yet, and the account-creation tools (`register`,
`verify_registration`) are the one thing you can't call until the server is connected — so
this is your real first action, not a tool call. Add an entry pointing at the remote server
**with no token** (the account-creation tools need none). Add it to the user's client config
and have them restart/reconnect their MCP client:

- Most clients (Cursor, etc.) — `mcpServers` with a bare URL:
  ```json
  { "mcpServers": { "bitrise": { "url": "https://mcp.bitrise.io" } } }
  ```
- VS Code — `servers` with an explicit type: `{ "servers": { "bitrise": { "type": "http", "url": "https://mcp.bitrise.io" } } }`
- Claude Desktop — via `mcp-remote`: `{ "mcpServers": { "bitrise": { "command": "npx", "args": ["mcp-remote", "https://mcp.bitrise.io"] } } }`

If you can't edit the config yourself, give the user the snippet to paste. If you don't know
which client they use, ask. Per-client details:
https://github.com/bitrise-io/bitrise-mcp#installation

> This is the **first of two reconnects**: you connect unauthenticated now, and reconnect
> once more in Step 4 after you have the token. Tell the user to expect both.

**Step 2 — Register the email.** Ask the user for the email address to register, then call
`register` with it. Bitrise emails them a one-time verification code (OTP) and returns a
`pending_signup_id`. **Don't invent or guess the code** — it's only in the user's inbox.

**Step 3 — Verify the code.** Ask the user for the code they received, then call
`verify_registration` with the `pending_signup_id` and the `otp`. On success it returns an
`api_token` (a Bitrise Personal Access Token) and a `workspace_slug` (a Workspace is created
automatically).

**Step 4 — Authenticate the connection** (the second reconnect). Add the token to the same
entry from Step 1: set the `Authorization` header to `Bearer <api_token>`, then reconnect.
(`verify_registration` returns client-specific instructions for this.) Confirm with `me` /
`list_workspaces`.

> The token from `verify_registration` is valid for **24 hours** — enough to finish
> onboarding. For long-term use, the user can create a durable PAT at
> https://app.bitrise.io/me/account/security and swap it into the same `Authorization`
> header.

## If something goes wrong

- **`register` says the email is already registered:** the user already has a Bitrise
  account. Don't retry — authenticate that existing account (OAuth, or a PAT) and skip
  ahead to "Once the account exists."
- **`verify_registration` rejects the code as invalid:** the code was wrong or mistyped —
  ask the user to re-check the email and try again with the **same** `pending_signup_id`.
- **The code expired, or too many attempts:** the pending signup is no longer usable — call
  `register` again to send a fresh code, then verify with the **new** `pending_signup_id`.

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
