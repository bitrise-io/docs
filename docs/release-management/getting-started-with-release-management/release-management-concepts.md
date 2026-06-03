---
title: "Release Management concepts"
description: "Release Management offers a high-level overview of your app's release workflow, such as creating release branches or uploading release candidates to TestFlight and Google Play"
sidebar_position: 6
slug: /release-management/getting-started-with-release-management/release-management-concepts
sidebar_label: Release Management key concepts
---

To successfully use Release Management, there are a few concepts you need to be aware of.

## Connected app

You [connect your app](https://devcenter.bitrise.io/en/release-management/getting-started-with-release-management/connecting-an-app.html) from the App Store or Google Play to a Bitrise project. This is what we call a connected app.

You need at least one connected app to be able to add and manage releases in Release Management. To use [build distribution](/en/release-management/build-distribution/distributing-builds-to-testers), you don't actually need to connect an app.

## Releases

You [manage releases](/en/release-management/releases/adding-a-new-release) of a connected app: each release is a new version of an app. An iOS release has a version number, and an Android release has a version name.

## Release Manager

A team member in Release Management with the [required permissions](https://devcenter.bitrise.io/en/release-management/configuring-connected-apps/release-management-roles-and-permissions.html) to manage releases. Project admins can [grant the Release Manager role](https://devcenter.bitrise.io/en/release-management/configuring-connected-apps/release-management-roles-and-permissions.html#granting-release-manager-rights) to [team members](https://devcenter.bitrise.io/en/release-management/configuring-connected-apps/release-management-roles-and-permissions.html#team-member-permissions). With this role, Release Managers are the only ones who can do any end-user-facing actions in Release Management: submit an iOS app for review or release an app to an app store.

## Release presets

For each connected app, you can define [presets](/en/release-management/releases/release-presets), which are configuration values automatically applied in a new blank release. After the presets are applied, you can still edit these values during the release process.

You can create a [release note preset](/en/release-management/releases/release-presets) as well. This means every release will be submitted to the App Store or Google Play with the same release notes. A release note preset can be identical in all localizations or you can manually edit it in the release stage.

## Release stages

Once you added a new release to a connected app and configured it, you can go through the different release steps of the release process, called stages. You can only move to the next release stage after completing the current one, but you can return to a previous stage any time.

iOS

Android

1. [Release candidate](/en/release-management/releases/managing-the-release-process/selecting-a-release-candidate): In the **Release candidate** stage, specify the release branch and select the Workflow that generates an IPA file.
1. [TestFlight](/en/release-management/releases/managing-the-release-process/testflight-upload-stage#uploading-the-release-candidate-to-testflight): Upload the release candidate to TestFlight, and distribute it for testing.
1. [Approvals](/en/release-management/releases/managing-the-release-process/creating-tasks-for-the-approvals-stage): You can create tasks for any stakeholder or team member whose approval is needed to continue with the release to the App Store.
1. [App Store review](/en/release-management/releases/managing-the-release-process/sending-your-app-to-app-store-review): Submit your update to review in the App Store, and get information on the approval progress.
1. [Release on the App Store](/en/release-management/releases/managing-the-release-process/releasing-your-app-on-the-app-store): You can release your app to all users at the same time, or configure a phased release.

1. [Release candidate](/en/release-management/releases/managing-the-release-process/selecting-a-release-candidate): In the **Release candidate** stage, specify the release branch and select the Workflow that generates an AAB file.
1. [Google Play upload and testing](/en/release-management/releases/managing-the-release-process/google-play-upload-stage#uploading-the-release-candidate-to-google-play): Upload the release candidate to Google Play, and distribute it for testing.
1. [Approvals](/en/release-management/releases/managing-the-release-process/creating-tasks-for-the-approvals-stage): You can create tasks for any stakeholder or team member whose approval is needed to continue with the release to Google Play.
1. [Release on Google Play](/en/release-management/releases/managing-the-release-process/releasing-your-app-on-the-app-store): You can release your app to all users at the same time, or configure a staged rollout.

## Build distribution

With Release Management [you can distribute the builds of your mobile apps](/en/release-management/build-distribution/distributing-builds-to-testers) to testers without having to engage with either TestFlight or Google Play.

Once you have installable artifacts, Bitrise can generate both private and public install links that testers and other stakeholders can use to install the app on real devices via over-the-air installation.

You can [define tester groups](https://devcenter.bitrise.io/en/release-management/build-distribution/tester-groups.html) that can receive notifications about installable artifacts and where those can be accessed.

## Approval task

You can [create tasks](/en/release-management/releases/managing-the-release-process/creating-tasks-for-the-approvals-stage) for each stakeholder and/or team member whose approval is needed to continue with the release to the App Store Connect or Google Play.

Optionally, you can assign an approval task to a team member or leave it unassigned. Only the assigned team member can approve the task. You can create and assign as many tasks as necessary. Once the tasks are ticked off, **Approvals** will be ticked off as well on the left navigation bar and you can proceed to App Store Review or releasing your app to Google Play.
