---
title: "About the release process"
sidebar_position: 1
slug: /release-management/releases/managing-the-release-process/about-the-release-process
---

Once you added a new release to a connected app and successfully configured it, you can go through the different release stages of the release process. You can only move to the next release stage after completing the current one, but you can return to a previous stage any time.

If you make changes to a previous stage, you must start the process over from that stage.

iOS

Android

1. [Release candidate](/en/release-management/releases/managing-the-release-process/selecting-a-release-candidate.html): In the **Release candidate** stage, specify the release branch and select the Workflow that generates an IPA file.

   :::note[Env Vars from Release Management]

   Release Management passes over certain Environment Variables to pipelines and workflows triggered by a [release automation](/en/release-management/releases/configuring-a-release/release-automation): [Available environment variables](/en/bitrise-ci/references/available-environment-variables).

   :::
1. [TestFlight](/en/release-management/releases/managing-the-release-process/testflight-upload-stage#uploading-the-release-candidate-to-testflight): Upload the release candidate to TestFlight, and distribute it for testing.
1. [Approvals](/en/release-management/releases/managing-the-release-process/creating-tasks-for-the-approvals-stage): You can create tasks for any stakeholder or team member whose approval is needed to continue with the release to the App Store.
1. [App Store review](/en/release-management/releases/managing-the-release-process/sending-your-app-to-app-store-review.html): Submit your update to review in the App Store, and get information on the approval progress.
1. [Release on the App Store](/en/release-management/releases/managing-the-release-process/releasing-your-app-on-the-app-store.html): You can release your app to all users at the same time, or configure a phased release.

1. [Release candidate](/en/release-management/releases/managing-the-release-process/selecting-a-release-candidate.html): In the **Release candidate** stage, specify the release branch and select the Workflow that generates an AAB file.
1. [Google Play upload and testing](/en/release-management/releases/managing-the-release-process/google-play-upload-stage#uploading-the-release-candidate-to-google-play): Upload the release candidate to Google Play, and distribute it for testing.
1. [Approvals](/en/release-management/releases/managing-the-release-process/creating-tasks-for-the-approvals-stage): You can create tasks for any stakeholder or team member whose approval is needed to continue with the release to Google Play.
1. [Release on Google Play](/en/release-management/releases/managing-the-release-process/releasing-your-app-on-the-app-store.html): You can release your app to all users at the same time, or configure a staged rollout.
