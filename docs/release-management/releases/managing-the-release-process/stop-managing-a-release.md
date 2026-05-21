---
title: "Stop managing a release"
description: "If you have started a release on Bitrise but decided to abandon it or complete it externally, you can stop managing that in-progress release regardless of the stage you are at on Bitrise. When stopped, the release becomes read-only and cannot be restarted."
sidebar_position: 9
slug: /release-management/releases/managing-the-release-process/stop-managing-a-release
---

If you have started a release on Bitrise but decided to abandon it or complete it externally, you can stop managing that in-progress release regardless of the stage you are at on Bitrise. When stopped, the release becomes read-only and cannot be restarted.

:::note[Feature access]

Only [Release Managers](/en/release-management/configuring-connected-apps/release-management-roles-and-permissions), [Project Admins](/en/bitrise-platform/projects/roles-and-permissions-for-bitrise-ci.html), and [workspace owners](/en/bitrise-platform/projects/roles-and-permissions-for-bitrise-ci#owners) have access to this feature.

:::

To stop managing a release:

1. Open your app in Release Management and select **Releases**.
1. Select a release from the list and click the arrow next to its name.
1. Select **Configuration** on the left.
1. Scroll down and click **Stop managing release**. This brings up a dialog.

   ![2025-08-08-rm-stop-managing-release.png](/img/_paligo/uuid-187924e0-afdb-8c78-53fe-809168944982.png)
1. Select a reason for stopping this release.

   ![2025-08-08-rm-stop-managing-release-dialog.png](/img/_paligo/uuid-b2fabd61-e0f2-af2c-3074-70940d45d4cc.png)

   - **Completed externally**: The release will be completed outside of Bitrise, either on App Store Connect or on Google Play Console.
   - **Abandoned**: The release is stopped on this stage and will not be completed. In both cases, the release turns to a read-only status on Bitrise.

After you confirm the changes, you can see a breakdown of all completed and not completed release stages. If you go back to the **Releases** page, you will see the stopped release with the status **Stopped managing** and a short explanation (**Abandoned**, **Completed externally**) you set before.
