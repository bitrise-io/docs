---
title: "Adding a new app to Release Management"
description: "To start using Release Management, you need to add at least one app. It doesn't require any store connection or a code repository. You will need to link the app to a [Bitrise project](urn:resource:component:54460)."
sidebar_position: 2
slug: /release-management/getting-started-with-release-management/adding-a-new-app-to-release-management
sidebar_label: Adding a new app
---

To start using Release Management, you need to add at least one app. It doesn't require any store connection or a code repository. You will need to link the app to a [Bitrise project](/en/bitrise-platform/projects/projects-overview.html). If you don't have an existing Bitrise project, we'll automatically create one for you.

To add an app:

1. Log in to Bitrise and select **Releases** from the left navigation menu.
1. If it's your first app, you will see the **Get started with Release Management** page. Start with adding your app.

   If it's not your first app, look for the **New app** button above the list of your apps.
1. Set a project for your app.

   - To link your app to an existing Bitrise project, select the **Existing project** option and choose a project from the dropdown menu.
   - To automatically create a new project, select the **New project** option. This project will be a Release Management project but you can add a CI configuration to it at any time.

   ![add-new-app-newproj.png](/img/_paligo/uuid-8821de29-e79d-0932-c3dd-f5deea8eba32.png)
1. On the next page, specify:

   - The app's title.
   - A mobile OS.
   - A package name or bundle ID, depending on the mobile OS.

   These are not validated at this point. We recommend using a package name or bundle ID that already exists in an online store but you can change it later anyway.

   ![adding-app.png](/img/_paligo/uuid-9073242e-afd9-262e-25cf-395ab1881ea6.png)
1. Click **Add app**.

Once an app is added, you can start uploading installable artifacts and use our build distribution feature: [Distributing builds to testers](/en/release-management/build-distribution/distributing-builds-to-testers).

To manage releases, you need to connect the app to an app store: [Connecting an app](/en/release-management/getting-started-with-release-management/connecting-an-app).
