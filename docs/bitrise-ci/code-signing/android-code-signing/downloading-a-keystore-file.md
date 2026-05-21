---
title: "Downloading a keystore file"
description: "You can define the location of the keystore file of an Android app in your `build.gradle` file. If the keystore file itself is missing from the location, you can use one of our file downloading Steps to download the keystore file from Bitrise and put it in the defined location."
sidebar_position: 1
slug: /bitrise-ci/code-signing/android-code-signing/downloading-a-keystore-file
sidebar_label: Downloading a keystore file from Bitrise during a build
---

A keystore file is required for Android code signing. You can define the location of the keystore file of an Android app in your `build.gradle` file: [Android code signing in Gradle](/en/bitrise-ci/code-signing/android-code-signing/android-code-signing-in-gradle). You can upload your keystore file to Bitrise and use the **File Downloader** Step to download the keystore file from Bitrise and put it in the location defined in the `build.gradle` file.

:::note[The Android Sign Step]

If you use the **Android Sign** Step to sign your app, you don't need to download the keystore file. The Step will find the file: [Android code signing using the Android Sign Step](/en/bitrise-ci/code-signing/android-code-signing/android-code-signing-using-the-android-sign-step).

:::

1. Add the **File Downloader** Step to your Workflow. The Step should be added BEFORE any Step that requires the keystore file, such as **Gradle Runner**.
1. Fill out the following two input fields:

   - **Download source url**: Set the generated keystore URL you get when you [upload your file to Bitrise](/en/bitrise-ci/code-signing/android-code-signing/uploading-android-keystore-files-to-bitrise)).
   - **Download destination path**: Set the location of the keystore file as a relative path. This path should be the same as the keystore path already defined in your `build.gradle` file (for example, `$HOME/keystores/project_release.keystore`).
1. Add the **Gradle Runner** Step right after your file downloading Step.

With that said, if you have successfully added the Steps to download your keystore file to the same location that you specified in your `build.gradle` file, you do not need the **Android Sign** Step in your workflow. Our **Gradle Runner** Step will sign and assemble your project.
