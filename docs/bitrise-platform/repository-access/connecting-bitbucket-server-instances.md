---
title: "Connecting Bitbucket Server instances"
description: "Connect your Bitrise workspace to Bitbucket Server to access your privately hosted repositories for CI builds."
sidebar_position: 6
slug: /bitrise-platform/repository-access/connecting-bitbucket-server-instances
---

Connect your Bitrise workspace to Bitbucket Server to access your privately hosted repositories for CI builds. You need to:

- Create a new Application Link on your server.
- Authorize Bitrise and assign the required permissions.
- Copy the necessary credentials to your workspace settings.

1. Log in to your Bitbucket Server instance with **admin** privileges.
1. Click the settings icon on the top menu bar to access **Administration**.
1. On the left menu bar, find the Integrations section, and select **Application Links**.
1. Click **Create link**.

   ![2025-11-13-bitbucket-app-links.png](/img/_paligo/uuid-f87af39b-bb44-1167-0051-389e3b38c612.png)
1. Select **External Application**, and **Incoming** as the direction.
1. In the Name field, enter a name that clearly identifies the application. For the sake of simplicity, we recommend **Bitrise**.
1. In the **Redirect URL** field, enter https://app.bitrise.io/users/auth/bitbucket_server/callback.
1. Under **Application permissions**, find **Repositories** and select **Admin**.
1. Click **Save**. You will be taken to the **Credentials** page.

   ![20251113-bitbucket-credentials.png](/img/_paligo/uuid-dbf18dae-38c9-f32a-fb61-6afbb08edb2f.png)
1. Copy the **Client ID** and the **Client secret**.
1. Open the **Workspace settings** page on Bitrise and select **Integrations**.
1. Select **Bitbucket Server** and then click **Add credentials**.

   ![2025-11-13-bitbucket-server-integration.png](/img/_paligo/uuid-6657cf32-779e-915b-aaea-453f88b28ec8.png)
1. Add your credentials:

   - **Client ID**
   - **Client secret**
   - **URL**: Your server's base URL
