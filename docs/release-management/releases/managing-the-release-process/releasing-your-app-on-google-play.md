---
title: "Releasing your app on Google Play"
description: "After your app has gone through all previous stages on Bitrise Release Management, it is ready for release. You can release your app to all users at the same time, or configure staged rollout for Google Play."
sidebar_position: 8
slug: /release-management/releases/managing-the-release-process/releasing-your-app-on-google-play
---

After your app has gone through all previous stages, it is ready for release. You can release your app to all users at the same time, or configure staged rollout for Google Play.

## Configuring staged rollout for Google Play

You can release your app to Google Play in staged rollouts. With staged rollout, you release your apps in several different stages, with only a certain percentage of users getting the new version with each stage. Users aren't notified that they are in a staged release. Automating the process means you don't have to manually release the app at each stage to a different segment of users: Release Management takes care of that automatically.

### Enabling staged rollout for Google Play

If you choose this option, your version update will be released over a seven-day period to a percentage of your users. Users aren’t notified that they're in a staged release of your app.

:::note[Failed rollout]

If the rollout stage fails for any reason, we’ll try it again later, until it succeeds, or you cancel or pause the automation.We try the failed rollout three times in an hour until it succeeds. After the rollout succeeds the rollout time for the stage will show the real rollout time, and not the planned time.

:::

1. On the **Release** stage, click Manage release.

   ![manage-release-button.png](/img/_paligo/uuid-bff97bcb-df0b-c062-3f8b-e446d171d6e9.png)
1. Select the **Automatically change rollout percentage over a 7-day period** option.
1. Select the rollout start time and date. The rollout must start at least ten minutes after the current time.
1. Click **Save changes**.

### Clearing the automated staged rollout schedule

You can clear the schedule before the first stage of the scheduled rollout is completed. If the first stage fails, you can still clear the rollout schedule, but after it is completed you can only [pause the automation](#section-idm4566296030356834170833265238), or [cancel it](#section-idm4575678678283234170834608148).

![release-scheduled.png](/img/_paligo/uuid-7b4d08a4-23ee-c089-5e7a-a8f2ea99abda.png)

1. Open your release.
1. Go to the **Release** stage.
1. Find the **Release summary** section.
1. Click the **Clear schedule** button.

### Cancelling an automated staged rollout

You can cancel the automated rollout at any time after the first stage of the rollout is completed. However, once the automation is cancelled, you can't resume it and you can only update it manually in Release Management.

1. Open your release.
1. Go to the **Release app version** stage.
1. Find the **Release summary** section.
1. Click the **Cancel automation** button.

   ![phased-rollout-cancel.png](/img/_paligo/uuid-29b1db0e-2fa8-8f7e-ba48-da85ed4db64b.png)

### Pausing automated staged rollout

You can pause and resume the automated rollout at any time after the first stage of the rollout is completed. There’s no limit to the number of pauses or the duration of the pause.

1. Open your release.
1. Go to the **Release app version** stage.
1. Go to **Staged rollout**.
1. Click **Pause automation**.

   ![phased-rollout.png](/img/_paligo/uuid-fd923003-5828-07e5-376b-b1d9e05c9652.png)

### Resuming automated staged rollout

You can pause and resume the automated rollout at any time after the first stage of the rollout is completed. There’s no limit to the number of pauses or the duration of the pause.

1. Open your release.
1. Go to the **Release** stage.
1. Find the **Release summary** section.
1. Click the **Resume automation** button.

   ![resume-rollout.png](/img/_paligo/uuid-2da28206-9def-429e-3b2f-d3d769b15c3b.png)
1. Select the resume time and date.

   :::important[Minimum time]

   The time and date must be at least ten minutes after the current time.

   :::

## Releasing your app

Once everything is configured, you can release your app. Depending on your settings, you can either release the app to all your users at the same time, or do a staged rollout.

1. Open your release.
1. Select **Release** on the left navigation bar.
1. Click **Release app**. It either releases your app to all users or starts a staged rollout, depending on your settings.

## Editing the release note of an Android app

If you wish to release an app with a different release note than [what's already set in Release presets](/en/release-management/releases/configuring-a-release/release-automation), you can manually edit the note before rolling out a new app version. This change will not override the default configuration of the **Release presets**, it only affects the current release.

:::note[Release Managers only]

Please note that only [Release Managers](https://devcenter.bitrise.io/en/release-management/getting-started-with-release-management/release-management-concepts.html) can edit release notes.

:::

To modify the release note of an Android app during the release process:

1. Go through the **Release candidate**, **Google Play**, and **Approvals** stages, then click **Release app version** on the left.
1. Scroll down to **Release note** and click **Edit**. You can see the default release note content in the text box.
1. Make your changes to the text. This new content will apply for the localization under **Language**.
1. You can copy the new content to additional localizations by clicking **Copy to** and selecting other localizations.
