---
title: "(Android) Deploy to Visual Studio App Center"
sidebar_position: 1
---

## Description

Build and distribute your app to testers via Visual Studio App Center.

## Prerequisites

1. An existing [Visual Studio App Center](https://docs.microsoft.com/en-us/appcenter/dashboard/) project where your app is registered.
1. Adding the API token as a [Secret](/en/bitrise-ci/configure-builds/secrets) to your Bitrise app with the name APPCENTER_API_TOKEN.
1. If you want to deploy a release build, don't forget to set up code signing on Bitrise to build and sign the APK with your release key.

## Instructions

1. Add the **[Android Build](https://www.bitrise.io/integrations/steps/android-build)** Step and set the following inputs:

   - **Build type**: set this to **apk**.
   - **Variant**: use release, debug, or one of your custom variants if you have any.
1. If you build a release variant, add the [Android Sign Step](https://github.com/bitrise-steplib/steps-sign-apk).

   You can skip this if you plan to deploy an unsigned debug variant.
1. Add the **[AppCenter iOS Deploy](https://www.bitrise.io/integrations/steps/appcenter-deploy-ios)** Step and set the following inputs:

   - **API Token**: $APPCENTER_API_TOKEN
   - **Owner name**: for example, `my-company`.
   - **App name**: For example, `my-app`. Use the App Center CLI to get the app name since it might not be the same as the one you can see on the Visual Studio App Center website.

Check out other options in the Step documentation or in the Workflow Editor.

## bitrise.yml

```yaml
- android-build@1:
        inputs:
        - variant: release
        - build_type: apk
    - sign-apk@1: {}
    - appcenter-deploy-android@2:
        inputs:
        - owner_name: my-company
        - app_name: my-app
        - app_path: "$BITRISE_APK_PATH"
        - api_token: "$APPCENTER_API_TOKEN"
```
