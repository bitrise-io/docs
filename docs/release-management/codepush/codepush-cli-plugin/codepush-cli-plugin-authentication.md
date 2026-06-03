---
title: "CodePush CLI plugin authentication"
sidebar_position: 2
---

To interact with the Bitrise API, which is required for CodePush commands, you need an API token. The token can be accessed in two ways:

- By creating an Environment Variable (Env Var) and referring to it in your configuration. We recommend this for CI builds.
- Storing the access token locally.

If you have both, the Env Var is resolved first and takes priority.

## Authenticating with an Env Var

1. [Generate a personal access token](urn:resource:component:54560) and copy it.
1. Add the value of the token to the BITRISE_API_TOKEN Environment Variable.
1. When running a command with the plugin, the CLI resolves the Env Var automatically.

## Storing the token locally

1. [Generate a personal access token](urn:resource:component:54560) and copy it.
1. Run the following command:

   ```
   bitrise :codepush auth login --token <TOKEN>
   ```

   The token is stored in the user configuration directory with restricted permissions (0600):

   - macOS: `~/Library/Application Support/codepush/config.json`
   - Linux: `~/.config/codepush/config.json`

## Revoking a locally stored token

If you want to revoke an API token that you stored locally for CodePush, you can do so at any time. If you revoke the token, you won't be able to interact with the Bitrise API unless you set the BITRISE_API_TOKEN Environment Variable.

To revoke the token, run the following command:

```
bitrise :codepush auth revoke
```
