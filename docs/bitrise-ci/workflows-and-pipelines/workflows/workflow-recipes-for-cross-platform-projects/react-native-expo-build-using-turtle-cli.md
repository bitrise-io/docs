---
title: "(React Native) Expo: Build using Turtle CLI"
sidebar_position: 2
---

## Description

Publish an app to Expo's servers and build an iOS App Store `.ipa` and an Android `.aab` file from your Expo project using [Turtle CLI](https://docs.expo.dev/eas/cli/).

## Prerequisites

1. Generate an iOS Distribution Certificate and an App Store Provisioning Profile based on the [Generating iOS code signing files guide](/en/bitrise-ci/code-signing/ios-code-signing/generating-ios-code-signing-files).
1. Generate an Android Keystore by following the [Android code signing with Android Studio guide](/en/bitrise-ci/code-signing/android-code-signing/android-code-signing-with-android-studio).
1. Make sure you can [Publish your Expo project](https://docs.expo.dev/eas/cli/#publish-your-project) locally.

## Instructions

1. Log in to Bitrise and select **Bitrise CI** on the left, then select your project.
1. Click the **Workflows** button on the main page.
1. Go to the **Code Signing & Files** tab.
1. Make sure that the project's iOS Distribution Certificate and App Store Provisioning Profile are uploaded.

   If not, add them in the **Add Provisioning Profile(s)** and the **Add a certificate (.p12 file) for code signing**, respectively.
1. Make sure that the project's Android Keystore file is uploaded.

   If not, drag-and-drop your keystore file to the **Upload file (max. 5 MB)** field of the **ANDROID KEYSTORE FILE** section.
1. Go to the **Secrets** tab.
1. Create a Secret (IOS_DEVELOPMENT_TEAM) with the ID of the iOS Development Team issued in the project's Certificate and Provisioning Profile.
1. Store the Expo account's username and password used for publishing in EXPO_USERNAME and EXPO_PASSWORD [Secrets](/en/bitrise-ci/configure-builds/secrets).
1. Switch to **YAML** at the top of the Workflow Editor.
1. Copy paste `envs` from `bitrise.yml` below to your Workflow.
1. Copy paste `steps` from `bitrise.yml` below to your Workflow.

   The built `.ipa` and `.aab` files are exposed via BITRISE_IPA_PATH and BITRISE_AAB_PATH Env Vars.

## bitrise.yml

```
turtle_build:
    envs:
    - KEYSTORE_PATH: /tmp/keystore.jks
    - KEYSTORE_ALIAS: $BITRISEIO_ANDROID_KEYSTORE_ALIAS
    - EXPO_ANDROID_KEYSTORE_PASSWORD: $BITRISEIO_ANDROID_KEYSTORE_PASSWORD
    - EXPO_ANDROID_KEY_PASSWORD: $BITRISEIO_ANDROID_KEYSTORE_PRIVATE_KEY_PASSWORD
    - PROFILE_PATH: /tmp/profile.mobileprovision
    - CERTIFICATE_PATH: /tmp/certificate.p12
    - EXPO_IOS_DIST_P12_PASSWORD: $BITRISE_CERTIFICATE_PASSPHRASE
    # Define these in your secrets
    - IOS_DEVELOPMENT_TEAM: $IOS_DEVELOPMENT_TEAM
    - EXPO_USERNAME: $EXPO_USERNAME
    - EXPO_PASSWORD: $EXPO_PASSWORD
    steps:
    - script@1:
        title: Install dependencies
        inputs:
        - content: |-
            #!/usr/bin/env bash
            set -ex

            node --version
            fastlane --version

            npm install -g turtle-cli
            turtle --version

            npm install -g expo-cli
            expo --version
    - file-downloader@1:
        title: Download Android Keystore
        inputs:
        - destination: $KEYSTORE_PATH
        - source: $BITRISEIO_ANDROID_KEYSTORE_URL
    - file-downloader@1:
        title: Download iOS Certificate
        inputs:
        - destination: $CERTIFICATE_PATH
        - source: $BITRISE_CERTIFICATE_URL
    - file-downloader@1:
        title: Download iOS Provisioning Profile
        inputs:
        - destination: $PROFILE_PATH
        - source: $BITRISE_PROVISION_URL
    - npm@1:
        title: Install project dependencies
        inputs:
        - command: install
    - set-java-version@1:
        title: Set Java version to Java 8
        inputs:
        - set_java_version: "8"
    - script@1:
        title: Run Expo publish
        inputs:
        - content: |-
            #!/usr/bin/env bash
            set -ex

            expo login -u $EXPO_USERNAME -p $EXPO_PASSWORD --non-interactive
            expo publish
    - script@1:
        title: Run Turtle build
        inputs:
        - content: |-
            #!/usr/bin/env bash
            set -ex

            turtle setup:android
            aab_path=$BITRISE_DEPLOY_DIR/expo-project.aab
            turtle build:android --type app-bundle --keystore-path $KEYSTORE_PATH --keystore-alias $KEYSTORE_ALIAS -o $aab_path
            envman add --key BITRISE_AAB_PATH --value $aab_path

            turtle setup:ios
            ipa_path=$BITRISE_DEPLOY_DIR/expo-project.ipa
            turtle build:ios --team-id $IOS_DEVELOPMENT_TEAM --dist-p12-path $CERTIFICATE_PATH --provisioning-profile-path $PROFILE_PATH -o $ipa_path
            envman add --key BITRISE_IPA_PATH --value $ipa_path
```
