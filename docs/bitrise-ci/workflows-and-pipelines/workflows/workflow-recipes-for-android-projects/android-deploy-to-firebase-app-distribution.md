---
title: "(Android) Deploy to Firebase App Distribution"
sidebar_position: 2
---

## Description

Build and distribute your app to testers via Firebase App Distribution. This example builds and deploys an APK, but the Workflow can be tweaked to distribute AAB instead.

## Prerequisites

- An existing Firebase project where your exact package name is registered. See [the Firebase documentation](https://firebase.google.com/docs/app-distribution/android/distribute-console?apptype=apk) for details.
- Obtain a token from Firebase by running `firebase login:ci` locally. See [the Firebase CLI docs](https://firebase.google.com/docs/cli#sign-in-test-cli) for details.
- Add this token as a [Secret](/en/bitrise-ci/configure-builds/secrets) to your Bitrise app with the name FIREBASE_TOKEN.
- Get your Firebase App ID from your project's **General Settings** page and pass this value as an input to the **Firebase App Distribution** Step.
- If you want to deploy a release build, don't forget [to set up code signing on Bitrise](/en/bitrise-ci/code-signing/android-code-signing/android-code-signing-using-the-android-sign-step) to build and sign the APK with your release key.

## Instructions

1. Add the **Android Build** Step and set the following inputs:

   - **Build type**: Set this to **apk**.
   - **Variant**: Use `release`, `debug`, or one of your custom variants if you have any.
1. If you build a release variant, add the **Android Sign** Step.

   You can skip this if you plan to deploy an unsigned debug variant.
1. Add the [Firebase App Distribution](https://github.com/guness/bitrise-step-firebase-app-distribution) Step and set the following inputs:

   - **Firebase token**: use the secret Env var previously defined: $FIREBASE_TOKEN.
   - **App path**: this should point to the APK that the previous steps have built and signed. By default, it's located at `$BITRISE_DEPLOY_DIR/app-release-bitrise-signed.apk`, but the exact file name might be different based on your project config.
   - **Firebase App ID**: get your Firebase App ID from your project's **General Settings** page and pass this value as an input to the **Firebase App Distribution** Step.
   - **Optional**: you can define test groups or individual testers in the Step inputs

## bitrise.yml

```
- android-build@1:
    inputs:
    - variant: release
    - build_type: apk
- sign-apk@1: {}
- firebase-app-distribution@0:
    inputs:
    - firebase_token: $FIREBASE_TOKEN
    - app_path: $BITRISE_DEPLOY_DIR/app-release-bitrise-signed.apk
    - app: your_app_id_from_firebase
    - testers: email@company.com # optional
    - groups: qa-team #optional
```
