---
title: "(Android) Deploy to Google Play (Internal, Alpha, Beta, Production)"
sidebar_position: 3
---

## Description

Build an Android app and upload to Google Play to internal, alpha, beta or production track.

## Prerequisites

- An [Android keystore file is uploaded](/en/bitrise-ci/code-signing/android-code-signing/android-code-signing-using-the-android-sign-step.html) to Bitrise.
- [Google Play API Access](/en/bitrise-ci/deploying/android-deployment/deploying-android-apps-to-bitrise-and-google-play/setting-up-google-play-api-access) is set up.

## Instructions

1. (Optional) Add the [**Change Android versionCode and versionName**](https://www.bitrise.io/integrations/steps/change-android-versioncode-and-versionname) Step. Set the input variables:

   - **Path to the build.gradle file**: The default value is `$PROJECT_LOCATION/$MODULE/build.gradle` and in most cases you don't have to change it.
   - **New versionName**: for example, `1.0.1`
   - **New versionCode**: for example, `42`.
1. Add the **[Android Build](https://github.com/bitrise-steplib/bitrise-step-android-build)** Step and set the following inputs:

   - **Build type**: Set this to **aab**.
   - **Variant**: Use `release`, `debug`, or one of your custom variants if you have any.
   - **Module**: for example $MODULE.
1. Add the **[Android Sign](https://github.com/bitrise-steplib/steps-sign-apk)** Step.
1. Add the **[Google Play Deploy](https://github.com/bitrise-steplib/steps-google-play-deploy)** Step and set the following inputs:

   - **Service Account JSON key file path**: $BITRISEIO_SERVICE_ACCOUNT_JSON_KEY_URL.
   - **Package name**: for example, `com.your.package.name`.
   - **Track**: Choose one of **internal**, **alpha**, **beta**, or **production**.
   - **Status**: The status of a release. For more information, see the [Google API reference](https://developers.google.com/android-publisher/api-ref/rest/v3/edits.tracks#Status). Recommended `draft` for production and `completed` for internal test builds.
   - Check the other options in the Workflow Editor or in the Step documentation.

   :::tip[Deploy to Google Play fails with Error 403]

   You might experience that Deploy to Google Play Step fails with error:

   ```
   "error: Failed to perform edit insert call, error: googleapi: Error 403: The caller does not have permission, forbidden"
   ```

   For possible solutions, check out our [Knowledge Base article](https://support.bitrise.io/hc/en-us/articles/360015780538-Deploy-to-Google-Play-fails-with-403-error).

   :::

## bitrise.yml

```
- change-android-versioncode-and-versionname@1:
    inputs:
    - new_version_name: 1.0.1
    - new_version_code: '42'
    - build_gradle_path: "$PROJECT_LOCATION/$MODULE/build.gradle"
- android-build@1:
    inputs:
    - project_location: "$PROJECT_LOCATION"
    - module: "$MODULE"
    - build_type: aab
    - variant: release
- sign-apk@1: {}
- google-play-deploy@3:
    inputs:
    - service_account_json_key_path: "$BITRISEIO_SERVICE_ACCOUNT_JSON_KEY_URL"
    - package_name: io.bitrise.sample.android
    - status: completed
    - track: internal
```
