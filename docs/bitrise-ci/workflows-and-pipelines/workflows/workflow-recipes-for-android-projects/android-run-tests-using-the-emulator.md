---
title: "(Android) Run tests using the emulator"
sidebar_position: 13
---

## Description

Run any kind of tests (unit, instrumentation) on a local emulator instance.

## Instructions

1. Add an **[AVD Manager](https://www.bitrise.io/integrations/steps/avd-manager)** Step. To customize the emulator, see the Step configuration.

   :::tip[Using the AVD Manager Step]

   The **AVD Manager** starts in the background, which can take several minutes. Because of that, we recommend adding the AVD Manager Step at the beginning of your Workflow (before **Activate SSH key (RSA private key)** Step and the **Git Clone** Step) to speed up your builds.

   :::
1. Add a [**Android Build for UI Testing**](https://www.bitrise.io/integrations/steps/android-build-for-ui-testing) Step, and configure the required inputs.
1. Add a **[Wait for Android emulator](https://www.bitrise.io/integrations/steps/wait-for-android-emulator)** Step.
1. Add an **Android Instrumented Test** Step, and configure the required inputs.
1. Add an **[Export test results to Test Reports](https://www.bitrise.io/integrations/steps/custom-test-results-export)** Step with the following inputs:

   - **The name of the test**: `Emulator tests`.
   - **Test result base path**: `$BITRISE_SOURCE_DIR/app/build/outputs/androidTest-results`.

     You might want to adjust the path based on the module name(s) in your project.
   - **Test result search pattern**: `*.xml`.
1. Add a **[Deploy to Bitrise.io](https://www.bitrise.io/integrations/steps/deploy-to-bitrise-io)** Step that makes the test results available in the **Tests** tab.

## bitrise.yml

```
- avd-manager@1: {}
- android-build-for-ui-testing@0:
        inputs:
        - module: "$ANDROID_TESTING_MODULE"
        - variant: "$ANDROID_V_DEBUG"
- wait-for-android-emulator@1:
- android-instrumented-test@0: {}
- custom-test-results-export@0:
    inputs:
    - search_pattern: "*.xml"
    - base_path: $BITRISE_SOURCE_DIR/app/build/outputs/androidTest-results
    - test_name: Emulator tests
- deploy-to-bitrise-io@2:
```
