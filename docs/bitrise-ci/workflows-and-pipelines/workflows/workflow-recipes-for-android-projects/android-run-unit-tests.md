---
title: "(Android) Run unit tests"
sidebar_position: 12
slug: /bitrise-ci/testing/testing-android-apps/android-unit-tests
---

## Description

[Run unit tests](/en/bitrise-ci/testing/testing-android-apps/android-unit-tests) (for example, `testDebugUnitTest`) for an Android app.

## Instructions

1. Add an **[Android Unit Test](https://www.bitrise.io/integrations/steps/android-unit-test)** Step.

   Set the input variables:

   - **Project Location**: Use the default $BITRISE_SOURCE_DIR or $PROJECT_LOCATION. You can set a specific path but the automatically exposed Environment Variables are usually the best option.
   - **Variant**: Use the $VARIANT [Enviromment Variable](/en/bitrise-ci/configure-builds/environment-variables), or specify a variant manually.
   - **Module**: Specify one or leave it blank to run tests in all of the modules.
1. Add a **[Deploy to Bitrise.io](https://www.bitrise.io/integrations/steps/deploy-to-bitrise-io)** Step that makes the test results available in the **Tests** tab.

## bitrise.yml

```
- android-unit-test@1:
    inputs:
    - project_location: $PROJECT_LOCATION
    - variant: $VARIANT
- deploy-to-bitrise-io@2: {}
```
