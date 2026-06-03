---
title: "About connected apps"
description: "You can [connect an app](/en/release-management/getting-started-with-release-management/connecting-an-app) from Apple's App Store or Google Play to a Bitrise app that has already been authenticated to access and manage data through the APIs of these services. Such an app is called a connected app. You need to have at least one connected app to use Release Management."
sidebar_position: 1
slug: /release-management/configuring-connected-apps/about-connected-apps
sidebar_label: About apps
---

Apps are the basic building blocks in Release Management. To do anything, either distributing your installable artifacts to testers, or releasing them to app stores, you need a Release Management app.

You can set up an app without setting up access to online services. But to take full advantage of everything Release Management offers, set up connections.

You can [connect an app](/en/release-management/getting-started-with-release-management/connecting-an-app) from Apple's App Store or Google Play to a Bitrise project that has already been authenticated to access and manage data through the APIs of these services. Such an app is called a connected app. You need to have at least one connected app to use Release Management.

Once an app is connected, you can:

- [Create default release configurations for it called release presets](/en/release-management/releases/release-presets).
- [View and modify its API access to online stores](/en/release-management/configuring-connected-apps/configuring-connected-app-integration).
- [Set up team member permissions](/en/release-management/configuring-connected-apps/release-management-roles-and-permissions).
- [Connect your LaunchDarkly account and select a project and environment to use its feature flags](/en/release-management/configuring-connected-apps/integrating-launchdarkly-feature-flags).

Configurations of a connected app apply to all [releases added](/en/release-management/releases/adding-a-new-release) to that particular app.
