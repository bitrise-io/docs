---
title: "(Android) Run Lint"
sidebar_position: 10
---

## Description

Runs Lint on your Android project.

## Instructions

1. Add the **[Android Lint](https://www.bitrise.io/integrations/steps/android-lint)** Step. Set the input variables:

   - **Project Location**: Use the default $BITRISE_SOURCE_DIR or $PROJECT_LOCATION.

     You can set a specific path but the automatically exposed [Environment Variables](/en/bitrise-ci/configure-builds/environment-variables) are usually the best option.
   - **Variant**: Use the $VARIANT Enviromment Variable, or specify a variant manually.
   - **Module**: Specify one or leave it blank to run lint in all of the modules.
1. Add a **[Deploy to Bitrise.io](https://www.bitrise.io/integrations/steps/deploy-to-bitrise-io)** Step. This Step uploads the lint report as a [build artifact](/en/bitrise-ci/run-and-analyze-builds/managing-build-files/build-artifacts-online).

## bitrise.yml

```
- android-lint@0:
    inputs:
    - variant: $VARIANT
- deploy-to-bitrise-io@2: {}
```
