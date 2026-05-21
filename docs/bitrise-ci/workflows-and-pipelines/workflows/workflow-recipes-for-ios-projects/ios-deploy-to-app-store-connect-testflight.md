---
title: "(iOS) Deploy to App Store Connect / TestFlight"
sidebar_position: 2
---

## Description

Archive the app and upload to App Store Connect to either release it to App Store or to TestFlight.

## Prerequisites

1. The source code is cloned and the dependencies (for example, Cocoapods, Carthage) are installed.
1. You have code signing set up. See [iOS code signing](/en/bitrise-ci/code-signing/ios-code-signing/creating-a-signed-ipa-for-xcode-projects) for more details.
1. You have Apple Developer connection set up. See [Apple services connection](/en/bitrise-platform/integrations/apple-services-connection/about-connecting-to-apple-services) for more details.

## Instructions

1. (Optional) Add the **[Set Xcode Project Build Number](http://bitrise.io/integrations/steps/set-xcode-build-number)** Step. Set the input variables:

   - **Info.plist file path**: for example, `MyApp/Info.plist`.
   - **Build Number**: for example, `42`.
   - **Version Number**: for example, `1.1`.
1. Add the **[Xcode Archive & Export for iOS](https://www.bitrise.io/integrations/steps/xcode-archive)** Step. Set the input variables:

   - **Project path**: by default, $BITRISE_PROJECT_PATH.
   - **Scheme**: by default $BITRISE_SCHEME.
   - **Distribution method**: it must be set to **app-store**.
1. Add the **[Deploy to App Store Connect - Application Loader (formerly iTunes Connect)](https://www.bitrise.io/integrations/steps/deploy-to-itunesconnect-application-loader)** Step. Set the input variable **Bitrise Apple Developer Connection**: for example, **api_key**.

   :::tip[Even more options with Deploy to App Store Connect with Deliver (formerly iTunes Connect)]

   Alternatively you can use the **[Deploy to App Store Connect with Deliver (formerly iTunes Connect)](https://www.bitrise.io/integrations/steps/deploy-to-itunesconnect-deliver)** Step as well, which gives you more options.

   :::

## bitrise.yml

```
- set-xcode-build-number@1:
    inputs:
    - build_short_version_string: '1.0'
    - plist_path: BitriseTest/Info.plist
- xcode-archive@4:
    inputs:
    - project_path: "$BITRISE_PROJECT_PATH"
    - scheme: "$BITRISE_SCHEME"
    - automatic_code_signing: api_key
    - distribution_method: app-store
- deploy-to-itunesconnect-application-loader@1:
    inputs:
    - connection: api_key
```
