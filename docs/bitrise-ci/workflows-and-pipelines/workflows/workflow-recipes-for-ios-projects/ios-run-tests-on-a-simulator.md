---
title: "(iOS) Run tests on a simulator"
sidebar_position: 9
---

## Description

Run unit or UI tests of an iOS app on a simulator.

## Instructions

1. Add an **[Xcode Test for iOS](https://www.bitrise.io/integrations/steps/xcode-test)** Step. Set the input variables:

   - **Project path**: The default value is $BITRISE_PROJECT_PATH and in most cases you don't have to change it.
   - **Scheme**: The default value is $BITRISE_SCHEME, this variable stores the scheme that you set when adding the app on Bitrise. You can specify a different scheme if you want but it must be a shared scheme.
   - **Device destination specifier**: (default: `platform=iOS Simulator,name=iPhone 8 Plus,OS=latest`).

   :::tip[Installing additional simulators for Xcode UI tests]

   If you need a simulator for your Xcode UI tests that is unavailable on the stack you are using, check out [this article](https://support.bitrise.io/hc/en-us/articles/360019999198-Installing-additional-simulators-for-Xcode-UI-tests) on Knowledge Base for a guide.

   :::
1. Add a **[Deploy to Bitrise.io - Apps, Logs, Artifacts](https://www.bitrise.io/integrations/steps/deploy-to-bitrise-io)** Step that makes the test results available in [test reports](/en/bitrise-ci/testing/deploying-and-viewing-test-results.html).

## bitrise.yml

```
- xcode-test@4: {}
- deploy-to-bitrise-io@2: {}
```
