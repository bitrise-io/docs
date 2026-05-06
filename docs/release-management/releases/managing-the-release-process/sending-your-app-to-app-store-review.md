---
title: "Sending your app to App Store review"
description: "After you’ve uploaded your release candidate to TestFlight and the build processing is finished, you can submit it for App Store review, where Apple will review your release."
sidebar_position: 6
slug: /release-management/releases/managing-the-release-process/sending-your-app-to-app-store-review
---

:::important[Role requirement]

To send your app to App Store review, you need to have the Release Manager role for your connected app.

:::

After you’ve uploaded your release candidate to TestFlight and the build processing is finished, you can submit it for App Store review, where Apple will review your release:

1. Open your release.
1. Select **App Store review** on the left navigation bar.
1. Review the **App Store release settings** section.

   ![app-store-review.png](/img/_paligo/uuid-0356f699-7e6f-0169-7fb3-82576e470b62.png)
1. Configure phased release by clicking **Change** on **Phased release for automatic updates**.

   If you opt for a phased release, at first, only some of your users will have access to the contents of your release. Gradually, over a 7-day period, all of your users will get access.
1. Configure version release by clicking **Change** on **Version release**. You can:

   - Release the app manually.
   - Release the app automatically: the app will be released as soon as Apple finishes the review.
   - Release the app automatically after App Store review but no earlier than a specified date.
1. Review the metadata at the **App Store metadata** section.
1. When done, click **Submit version** on the top right part of the page.

   :::tip[Canceling App Store review]

   You can cancel the App Store review before it finishes by clicking on the **Cancel App Store review** button.

   :::

You can monitor the release status on the **Release** page.

You can proceed to [Releasing your app on the App Store](/en/release-management/releases/managing-the-release-process/releasing-your-app-on-the-app-store) for manual releases.

## Editing the release note of an iOS app

If you wish to release an app with a different release note than what's [already set in release presets](/en/release-management/releases/configuring-a-release/release-automation), you can manually edit the note before rolling out a new app version. This change will not override the default configuration of the **Release presets**, it only affects the current release.

:::note[Release Managers only]

Please note that only [Release Managers](https://devcenter.bitrise.io/en/release-management/getting-started-with-release-management/release-management-concepts.html) can edit release notes.

:::

To modify the release note of an iOS app during the release process:

1. Go through the **Release candidate**, **TestFlight**, and **Approvals** stages, then click **App store review** on the left.
1. Scroll down to **App Store Metadata**.
1. Click **What's new in this version**, then **Edit metadata**. Here you can change the release note. It will only apply to the selected localization shown under **Language**.
1. Optionally, you can copy the new content to all localizations by ticking **Use same content for all localizations**.
1. You can copy the new content to additional localizations by clicking **Copy to** and selecting the localizations of your choice.
