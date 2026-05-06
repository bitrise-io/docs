---
title: "Testing iOS apps"
sidebar_position: 1
slug: /bitrise-ci/testing/testing-ios-apps
---

- [Run UI and unit tests with Xcode](/en/bitrise-ci/testing/testing-ios-apps/running-unit-and-ui-tests-for-ios-apps.html) using our **Xcode Test for iOS** Step. With this Step, you don't need code signing and you can easily export your test results to the **Tests** tab.
- [Build an iOS app for testing](/en/bitrise-ci/testing/testing-ios-apps/building-an-ios-app-for-testing.html) with the **Xcode Build for testing for iOS** Step. The Step uses the `build-for-testing` action of `xcodebuild` to build your test targets and exports the resulting bundle. You can use this bundle, for example, to perform device testing with Firebase.
- [Build an iOS app for a simulator](/en/bitrise-ci/testing/testing-ios-apps/building-an-ios-app-for-a-simulator.html) with the **Xcode Build for Simulator** Step. The Step builds an `.app` file that you can install on an iOS simulator. This requires no code signing, and as such it is a simple way to provide a testable app for your testers.

You can easily run multiple tests in parallel with Pipelines: [Currently supported use cases for the iOS platform](/en/bitrise-ci/workflows-and-pipelines/build-pipelines/pipelines-with-stages/currently-supported-use-cases-for-the-ios-platform).
