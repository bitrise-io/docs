---
title: "Authenticating with the Bitrise API"
description: "You need to create a personal access token to authenticate with the Bitrise API. The token is needed for all endpoints."
sidebar_position: 2
slug: /bitrise-ci/api/authenticating-with-the-bitrise-api
---

The current API supports two types of authentication:

- User-generated **personal access tokens**.
- Workspace API tokens.

Every API endpoint requires authentication, except the “root” URL ([https://api.bitrise.io](https://api.bitrise.io)).

1. Create either a [personal access token](/en/bitrise-platform/accounts/personal-access-tokens#creating-a-personal-access-token) or [a Workspace API token](/en/bitrise-platform/workspaces/workspace-api-token#creating-a-workspace-api-token).
1. Save it in a secure way.
1. Add an `Authorization` header with the access token to your API calls.

   For example, the following call retrieves a list of apps you or your Workspace has access to:

   ```yaml
   curl -X 'GET' \
     'https://api.bitrise.io/v0.1/apps' \
     -H 'Authorization: <ACCESS-TOKEN>'
     -H 'accept: application/json'
   ```
