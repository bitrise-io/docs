# Bitrise for AI agents — connect the user to Bitrise

> You — the AI agent — can **connect the user to Bitrise from this session**. The MCP server
> uses OAuth: you point the client at `https://mcp.bitrise.io` with **no token**, and the client
> detects that the server needs authorization and starts a sign-in in the user's browser. They
> sign in or create an account once, approve the connection, and the client is authorized — no
> token to read back,
> no token to paste. (Bitrise is mobile CI/CD and app distribution — iOS, Android, Flutter,
> React Native.) **You can't complete the browser sign-in for them** — your job is to wire up
> the server, then guide them through it.

## When this applies

The user wants to use Bitrise (CI/CD, app distribution, or getting a local build onto
devices). The flow is the same whether or not they already have an account:

- **No account yet** → they create one during the browser sign-in (GitHub, Bitbucket, Google,
  another social SSO, or email + password). A Workspace is created for them automatically.
- **Already has an account** → they just sign in and approve the connection.

There's no separate account-creation step for you to run, and nothing to do over raw HTTP —
the account is created (or matched) inside the browser sign-in. Per-client setup details:
https://github.com/bitrise-io/bitrise-mcp#installation

## Connect the MCP server

**Always give the user both a CLI command and a copy-pastable JSON snippet, and let them use
whichever matches their client — never offer only one.** Use the remote server
`https://mcp.bitrise.io` with **no `Authorization` header** — OAuth supplies the credentials:

- CLI (Claude Code):
  ```bash
  claude mcp add --transport http bitrise https://mcp.bitrise.io
  ```
- JSON — most clients (Cursor, etc.), `mcpServers`:
  ```json
  { "mcpServers": { "bitrise": { "url": "https://mcp.bitrise.io" } } }
  ```
- JSON — VS Code uses `servers` with an explicit `"type": "http"`:
  ```json
  { "servers": { "bitrise": { "type": "http", "url": "https://mcp.bitrise.io" } } }
  ```
- JSON — Claude Desktop connects via `mcp-remote`:
  ```json
  { "mcpServers": { "bitrise": { "command": "npx", "args": ["mcp-remote", "https://mcp.bitrise.io"] } } }
  ```

If you can't edit the config yourself, hand the user the matching command/snippet. If you
don't know which client they use, ask. Then have them reload the connection so the config
takes effect — explain *how* for their client (see "Reconnecting the MCP client" below), don't
just say "reconnect".

## Guide the user through sign-in

The server requires authorization and won't connect anonymously, so **you can't sign in or
authorize through the tools** — the MCP client handles it. When the client connects, it detects
that Bitrise needs authorization and starts the sign-in in the user's browser. How they start it
differs by client — in Claude Code the user runs `/mcp`, selects **bitrise**, and starts the
sign-in. Tell them what to expect on the sign-in page:

1. **Sign in or sign up** with **GitHub**, **Bitbucket**, **Google**, another social provider,
   or an **email and password**. New accounts are created right here — no separate website
   sign-up.
2. **Approve the connection** on the consent screen that names the requesting application.

When they approve, the browser hands authorization back to the client automatically — no token
to read back or paste. Their sign-in also logs them into the Bitrise website
(`https://app.bitrise.io`) in the same browser, so they won't need to log in there separately.

### If they signed up with email and password

Bitrise sends a confirmation email **immediately** and shows a "confirm your email" screen.
Tell the user:

- Open the email on **any device** (the machine running the agent, their phone, anything) and
  click the confirmation link.
- The confirmation screen **polls** for confirmation, so it doesn't matter which device they
  click on. Once confirmed, the screen reloads itself within a few seconds and continues the
  authorization automatically — they don't need to return to the original window or re-enter
  anything.

Social sign-ins (GitHub, Bitbucket, Google) are already verified and skip this step.

## Confirm it worked

After they approve (and confirm their email, if applicable), call `me` or `list_workspaces` to
verify the connection. A Workspace exists automatically for new users.

## Reconnecting the MCP client

Connecting or updating the config doesn't take effect until the client reloads the Bitrise MCP
server. Some clients also surface the OAuth sign-in at this point (in Claude Code, `/mcp` is
where the user authenticates). **Don't just tell the user to "reconnect" — walk them through it
for their client**, and ask which client they use if you don't know. The common ways:

- **Claude Code (CLI):** run `/mcp` to view, reconnect, and authenticate the server, or exit
  and relaunch `claude`.
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

- **No sign-in prompt appeared:** have the user reload the MCP server in their client (see
  "Reconnecting the MCP client") to re-trigger the authorization prompt — in Claude Code, run
  `/mcp` and start the sign-in for **bitrise**.
- **The user closed the page before approving:** trigger any Bitrise tool again to restart the
  sign-in.
- **Stuck on the "confirm your email" screen:** make sure they clicked the confirmation link in
  the email (check spam). The screen polls and continues on its own once confirmed — no refresh
  needed.
- **"This email is already registered" during sign-up:** the user already has a Bitrise
  account. Don't create a new one — have them **sign in** with that provider or email instead.

## Using a personal access token instead

OAuth issues and refreshes short-lived tokens automatically, so the user normally manages
nothing. If they prefer a fixed credential — for CI, scripts, or a client that doesn't support
OAuth — they can create a durable PAT at `https://app.bitrise.io/me/account/security` and add
it as an `Authorization: Bearer <token>` header on the same server entry. Treat the token as a
secret — don't echo it into shared chats, logs, or committed files.

## Once the account exists

The same MCP connection now drives the rest of Bitrise — creating apps, connecting repos,
configuring `bitrise.yml`, triggering builds, reading logs, and managing artifacts &
distribution. For conventions and a guided walkthrough of connecting the repo and running the
first build, load the knowledge skill:

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
```
