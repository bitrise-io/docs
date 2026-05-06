---
title: "(Android) Run instrumentation tests on virtual devices"
sidebar_position: 8
---

## Description

Run instrumentation (for example, Espresso) or robo/gameloop tests on virtual devices. [Our device testing solution](/en/bitrise-ci/testing/device-testing-with-firebase/device-testing-for-android.html) is based on Firebase Test Lab. You can find the resulting logs, videos and screenshots on Bitrise.

## Instructions

1. Add an **Android Build for UI Testing** Step. Set the input variables:

   - **Project Location**: Use the default $BITRISE_SOURCE_DIR or $PROJECT_LOCATION. You can set a specific path but the automatically exposed Environment Variables are usually the best option.
   - **Variant**: Use the $VARIANT [Enviromment Variable](/en/bitrise-ci/configure-builds/environment-variables.html), or specify a variant manually.
   - **Module**: Specify one or leave it blank to run tests in all of the modules.
1. Add a **Virtual Device Testing for Android** Step. Set the input variables:

   - **Test type**: **instrumentation** (or **robo** or **gameloop**)
   - **(Optional) Test devices** (default: **NexusLowRes,24,en,portrait**).
1. Add a **Deploy to Bitrise.io** Step that makes the test results available in the [test reports](/en/bitrise-ci/testing/deploying-and-viewing-test-results.html).

:::tip[Potential issues with running instrumentation tests on virtual devices]

You might encounter some unexpected issues while running instrumentation tests on virtual devices. You can find some examples and possible solutions in our Knowledge Base:

- [Tips for flaky Android emulator tests](https://support.bitrise.io/hc/en-us/articles/360019478817-Tips-for-flaky-Android-emulator-tests)
- [Test failed with Virtual Device Testing for Android Step](https://support.bitrise.io/hc/en-us/articles/360014446058-Test-failed-with-BETA-Virtual-Device-Testing-for-Android-step)

:::

## bitrise.yml

```
- android-build-for-ui-testing@0:
    inputs:
    - variant: $VARIANT
    - module: $MODULE
- virtual-device-testing-for-android@1:
    inputs:
    - test_type: instrumentation
- deploy-to-bitrise-io@2: {}
```
