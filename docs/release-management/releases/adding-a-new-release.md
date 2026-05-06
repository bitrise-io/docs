---
title: "Adding a new release"
description: "In Release Management, you can add a new release to a connected app. Each release has its own configuration that you can modify at any time."
sidebar_position: 2
slug: /release-management/releases/adding-a-new-release
---

To release a connected app to the App Store or Google Play, you need to add a new release. Each app can have multiple releases.

To add a new release to [a connected app](/en/release-management/getting-started-with-release-management/connecting-an-app.html):

1. Log in to Bitrise, and on the left sidebar, select **Releases**.
1. Select your app from the list.

   ![2025-08-07-rm-your-apps-list.png](/img/_paligo/uuid-c446a6a9-f922-2641-53ad-49099a7921fe.png)
1. Go to **Releases** and click **+ New app version**. This opens the **New app version** page.
1. Enter a version number for iOS apps or a release name for Android apps. Optionally, you can also add a description.

   :::note[Release description is internal only]

   The release description is internal only, and it will not be included in the App Store review submission (metadata).

   :::
1. Select a template from the **Preset template** dropdown menu.

   You can configure templates in [Release presets](/en/release-management/releases/release-presets.html).
1. Click **Add app version**.

After successfully adding a release, you can modify its configuration at any time: [Configuring a release](/en/release-management/releases/configuring-a-release).
