---
title: "Connecting another CI service to Release Management"
description: "You can use Release Management even if you don't use Bitrise CI. All you need to do to take advantage of all Release Management features is to upload your app's binary as a release candidate."
sidebar_position: 4
slug: /release-management/getting-started-with-release-management/connecting-another-ci-service-to-release-management
---

You can use Release Management even if you don't use Bitrise CI. Upload your app's binary as a release candidate to access all Release Management features.

For now, using Release Management still requires a Bitrise CI project as it's the only way to set up a [connected app](/en/release-management/getting-started-with-release-management/connecting-an-app). However, you don't have to run Bitrise CI builds: once the project is added, you can use Release Management without Bitrise CI. In the near future, Release Management will become a standalone solution.

To connect your CI service to Release Management:

1. Sign up for Bitrise and [add a new Bitrise CI project](/en/bitrise-build-cache/getting-started-with-the-build-cache/getting-started-with-the-build-cache#adding-a-new-connection-to-the-build-cache).
1. [Connect an app](/en/release-management/getting-started-with-release-management/connecting-an-app) in Release Management.

   This includes setting up your project's connection to App Store Connect and/or Google Play.
1. [Use our API to upload an installable artifact](/en/release-management/installable-artifacts).
1. Select this artifact at the [release candidate stage](/en/release-management/releases/managing-the-release-process/selecting-a-release-candidate).
