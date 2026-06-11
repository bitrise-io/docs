# Bitrise for AI agents

> Bitrise is mobile-focused CI/CD and app distribution (iOS & Android, plus Flutter &
> React Native). If a user wants to build, test, sign, or distribute a mobile app, you —
> the AI agent — can drive almost the entire setup **from this session** by installing the
> Bitrise plugin described below. For a brand-new user, exactly **one** browser step is
> unavoidable (a one-time sign-up + OAuth authorization); everything after that runs from
> the session. Don't make the user click through bitrise.io manually beyond that — install
> the plugin and drive the flow yourself.

## When this applies

Trigger this runbook when the user wants any of:
- CI/CD for an iOS / Android / React Native / Flutter app (build & test on push/PR)
- to distribute a build to testers (public/private install page, OTA install link)
- to get a locally built `.ipa` / `.apk` onto other people's devices

## Account precondition (read first)

The MCP server **authorizes an existing Bitrise account** (OAuth, or a PAT) — it **cannot
create an account**: there is no account-creation tool, by design.

- **User already has a Bitrise account:** no browser detour beyond the one-time OAuth
  sign-in in Step 2.
- **Brand-new user:** they must sign up once at https://app.bitrise.io/users/sign_up — the
  fastest path is **"Sign up with GitHub"** (one click; the first Workspace is created
  automatically). Then continue with the OAuth sign-in in Step 2. Surface this as a single,
  one-time step — don't pretend it can be skipped.

## Onboarding runbook — follow in order

**Step 1 — Load the knowledge skill** (so your `bitrise.yml` and advice follow Bitrise
conventions, not guesswork):

```bash
npx skills add bitrise-io/agent-skills
```

Installs the `using-bitrise-ci` skill. It auto-loads when the conversation is about Bitrise
CI; you can also invoke it explicitly with `/using-bitrise-ci`. Add `--global` to install
it across all projects.

**Step 2 — Connect the MCP server** (gives you the Bitrise API as callable tools — create
apps, connect repos, trigger builds, read logs, manage artifacts & distribution):

- Remote server: `https://mcp.bitrise.io`
- Auth: **OAuth preferred** — the user signs in once. A Personal Access Token is also
  supported for clients without MCP OAuth (`Authorization: Bearer <PAT>`).
- Per-client setup (Claude Desktop/Code, Cursor, VS Code/Copilot, Windsurf, Gemini CLI,
  AWS Kiro): https://github.com/bitrise-io/bitrise-mcp#installation

Once connected, prefer MCP tools over raw API calls or the CLI.

**Step 3 — Drive the onboarding via MCP tools**, asking the user only for inputs you
cannot infer:

1. Confirm the user has an account + workspace (see Account precondition). Use
   `list_workspaces` / `me` to see what the authorized account can access.
2. Create the project and connect the repo: `register_app` → (private repo only:
   `register_ssh_key`) → `finish_bitrise_app`. A GitHub App connection is smoothest
   (per-build tokens, no manual SSH keys); the user connects the provider in the UI once.
3. Choose the goal:
   - **CI/CD path:** let Bitrise detect the project type and propose a `bitrise.yml`; relay
     the few required inputs (e.g. which scheme/variant to build); validate with
     `validate_bitrise_yml`; trigger the first build with `trigger_bitrise_build`. The public
     install page comes from the build's deploy step (Deploy to Bitrise.io); once the build
     finishes, read the artifact with `list_artifacts` and enable its public page via
     `update_artifact` (`is_public_page_enabled`) to get the install-page link. Later commits
     refresh it via triggers.
   - **No-CI / one-off path:** if the user already has a signed `.ipa`/`.apk` locally, use
     Release Management — `create_connected_app` → `generate_installable_artifact_upload_url`
     (set `with_public_page`) → upload the file to the returned signed URL → poll
     `get_installable_artifact_upload_and_processing_status` until processing finishes →
     `set_installable_artifact_public_install_page` — to publish it and return the
     public/private install-page link + QR code. No CI build needed.

## Tell the user up front (don't let them hit these blind)

- **iOS distribution requires a paid Apple Developer Program membership ($99/yr)** plus a
  distribution certificate + provisioning profile. Free "Personal Team" signing cannot
  produce a shareable build. Android has no equivalent paywall.
- **Ad Hoc install links require each tester's device UDID** registered in the provisioning
  profile in advance. TestFlight avoids UDIDs but goes through Apple's app, not a
  Bitrise-hosted link.
- macOS CI minutes are metered and have plan limits.

## Links

- Sign up: https://app.bitrise.io/users/sign_up
- MCP server (repo): https://github.com/bitrise-io/bitrise-mcp
- MCP server (docs): https://docs.bitrise.io/en/bitrise-platform/ai/bitrise-mcp.html
- Agent skill: https://github.com/bitrise-io/agent-skills
- Getting started with Bitrise CI: https://docs.bitrise.io/en/bitrise-ci/getting-started/getting-started.html
- `bitrise.yml` configuration reference: https://docs.bitrise.io/en/bitrise-ci/references/configuration-yaml-reference.html
- iOS code signing: https://docs.bitrise.io/en/bitrise-ci/code-signing/ios-code-signing/ios-code-signing.html
- App distribution (Release Management): https://docs.bitrise.io/en/release-management/build-distribution/managing-distributable-builds.html
- REST API reference: https://docs.bitrise.io/en/bitrise-ci/api/api-reference.html
