---
title: "(iOS) Run tests on a physical device"
sidebar_position: 8
---

## Description

Run unit or UI tests on a physical device. Our [device testing solution](/en/bitrise-ci/testing/device-testing-with-firebase/device-testing-for-ios.html) is based on [Firebase Test Lab](https://firebase.google.com/docs/test-lab/). You can find the resulting logs, videos and screenshots on Bitrise.

## Prerequisites

1. The source code is cloned and the dependencies (for example, Cocoapods, Carthage) are installed.
1. You have code signing set up. See [iOS code signing](/en/bitrise-ci/code-signing/ios-code-signing.html) for more details.

## Instructions

1. Add an **[Xcode Build for testing for iOS](https://www.bitrise.io/integrations/steps/xcode-build-for-test)** Step.
1. Add a **[[BETA] iOS Device Testing](https://www.bitrise.io/integrations/steps/virtual-device-testing-for-ios)** Step and setup code signing.
1. Add a **[Deploy to Bitrise.io - Apps, Logs, Artifacts](https://www.bitrise.io/integrations/steps/deploy-to-bitrise-io)** Step that makes the test results available in [test reports](/en/bitrise-ci/testing/deploying-and-viewing-test-results.html).

## bitrise.yml

```
- xcode-build-for-test@1:
    inputs:
    - automatic_code_signing: api_key
- virtual-device-testing-for-ios@1: {}
- deploy-to-bitrise-io@2: {}
```
