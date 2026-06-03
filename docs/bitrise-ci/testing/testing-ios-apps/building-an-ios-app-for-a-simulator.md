---
title: "Building an iOS app for a simulator"
sidebar_position: 3
slug: /bitrise-ci/testing/testing-ios-apps/building-an-ios-app-for-a-simulator
---

You can build an iOS app for an iOS or tvOS simulator platform.

To do this, you'll need the **Xcode Build for Simulator** Step. The Step creates an `.app` file which you can install on any macOS device or send to, for example, testers. This requires no code signing at all, so it is an easy way to create a distributable version of your iOS app.

The Step also creates an `.xctestrun` file which you can use to run tests. Both the `.app` file and the `.xctestrun` file can be accessed by subsequent Steps referring to their output variable, and they can be [downloaded as a build artifact](/en/bitrise-ci/run-and-analyze-builds/managing-build-files/build-artifacts-online).

To build the app for a simulator:

Workflow Editor

Configuration YAML

1. Make sure you install all necessary dependencies in your Workflow.

   We have dedicated Steps for many different dependency managers, including:

   - [Carthage](https://bitrise.io/integrations/steps/carthage)
   - [CocoaPods](https://bitrise.io/integrations/steps/cocoapods-install)
   - [Homebrew](https://bitrise.io/integrations/steps/brew-install)
1. Add the **Xcode Build for Simulator** Step to your Workflow after the Step(s) installing dependencies.
1. Make sure the **Project path** input points to either your `.xcodeproj` or `.xcworkspace` file.

   The input sets the `-project` or `-workspace` option of the `xcodebuild` command. In most cases, if your app has been automatically configured by the project scanner during the [process of adding the app](/en/bitrise-ci/getting-started/adding-a-new-project), the default value does not need to be changed.
1. In the **Scheme** input, set the name of the [Xcode scheme](https://developer.apple.com/documentation/xcode/customizing-the-build-schemes-for-a-project/) you want to use to build the app.

   ![scheme-input.png](/img/_paligo/uuid-2700f022-4822-82fe-77e4-1a0995b41ab6.png)

   The input sets the `-scheme` option of the `xcodebuild` command. The default value is an Environment Variable created when adding the app and performing the first-time configuration. If you need to use a different scheme, you can type its name here.

   :::tip[Build configuration]

   By default, the Step will use the build configuration specified in the scheme. However, you can override it and use a different build configuration: add the name of the desired build configuration to the **Configuration name** input. This input is optional and you only need it if you don't want to use the build configuration specified in the selected scheme.

   You can create new build configurations in your Xcode project at any time: [Adding a build configuration file to your project](https://developer.apple.com/documentation/xcode/adding-a-build-configuration-file-to-your-project).

   :::
1. In the **Device destination specifier** input, select **generic/platform=iOS Simulator**

   ![ios-simulator-destination.png](/img/_paligo/uuid-7235d345-4190-c1be-6ee3-fc25e1eb183e.png)
1. Optionally, set the **Build settings (xcconfig), allow code signing** input to **CODE_SIGNING_ALLOWED=YES**. This allows code signing files to be installed during the build.

   In most cases, you don't need code signing for an app built for a simulator. It might be required for certain test cases or third-party dependencies. To set up code signing, see [iOS code signing](/en/bitrise-ci/code-signing/ios-code-signing/creating-a-signed-ipa-for-xcode-projects).
1. To access your app as a build artifact, add the **Deploy to Bitrise.io** Step to the end of your Workflow. By default, you don't have to modify anything in the Step's configuration.

1. Make sure you install all necessary dependencies in your Workflow.

   We have dedicated Steps for many different dependency managers, including:

   - [Carthage](https://bitrise.io/integrations/steps/carthage)
   - [CocoaPods](https://bitrise.io/integrations/steps/cocoapods-install)
   - [Homebrew](https://bitrise.io/integrations/steps/brew-install)
1. Add the `[xcode-build-for-simulator](https://github.com/bitrise-steplib/steps-xcode-build-for-simulator)` Step to your Workflow after the Step(s) installing dependencies.

   ```yaml
   workflows:    
     primary:
       steps:
         - cocoapods-install
         - xcode-build-for-simulator:
             inputs:
   ```
1. Make sure the `project_path` input points to either your `.xcodeproj` or `.xcworkspace` file.

   The input sets the `-project` or `-workspace` option of the `xcodebuild` command. In most cases, if your app has been automatically configured by the project scanner during the [process of adding the app](/en/bitrise-ci/getting-started/adding-a-new-project), the default value does not need to be changed.

   ```yaml
   - xcode-build-for-simulator:
       inputs:
         - project_path: $BITRISE_PROJECT_PATH
   ```
1. In the `scheme` input, set the name of the [Xcode scheme](https://developer.apple.com/documentation/xcode/customizing-the-build-schemes-for-a-project/) you want to use to build the app.

   The input sets the `-scheme` option of the `xcodebuild` command. The default value is an Environment Variable created when adding the app and performing the first-time configuration. If you need to use a different scheme, make sure to type the name of the scheme correctly.

   ```yaml
   - xcode-build-for-simulator:
       inputs:
         - scheme: $BITRISE_SCHEME
         - project_path: $BITRISE_PROJECT_PATH
   ```

   :::tip[Build configuration]

   By default, the Step will use the build configuration specified in the scheme. However, you can override it and use a different build configuration: add the name of the desired build configuration to the `configuration` input. This input is optional and you only need it if you don't want to use the build configuration specified in the selected scheme.

   You can create new build configurations in your Xcode project at any time: [Adding a build configuration file to your project](https://developer.apple.com/documentation/xcode/adding-a-build-configuration-file-to-your-project).

   :::
1. Set the `destination` input to `generic/platform=iOS Simulator`.

   ```yaml
   - xcode-build-for-simulator:
       inputs:
         - scheme: $BITRISE_SCHEME
         - destination: generic/platform=iOS Simulator
         - project_path: $BITRISE_PROJECT_PATH
   ```
1. Optionally, set the `xcconfig_content` input with the value `CODE_SIGNING_ALLOWED=YES`. This allows code signing files to be installed during the build.

   In most cases, you don't need code signing for an app built for a simulator. It might be required for certain test cases or third-party dependencies. To set up code signing, see [iOS code signing](/en/bitrise-ci/code-signing/ios-code-signing/creating-a-signed-ipa-for-xcode-projects).

   ```yaml
   - xcode-build-for-simulator:
       inputs:
         - scheme: $BITRISE_SCHEME
         - destination: generic/platform=iOS Simulator
         - xcconfig_content: |-
             CODE_SIGNING_ALLOWED=YES            
             COMPILER_INDEX_STORE_ENABLE = NO
         - project_path: $BITRISE_PROJECT_PATH
   ```
1. To access your app as a build artifact, add the `deploy-to-bitrise-io` Step to the end of your Workflow. By default, you don't have to modify anything in the Step's configuration.

   ```yaml
   primary:
     steps:
       - generate-cordova-build-configuration@0: {}
       - xcode-build-for-test@2: {}
       - xcode-test@4: {}
       - xcode-build-for-simulator@0.12:
           inputs:
             - scheme: $BITRISE_SCHEME
             - destination: generic/platform=iOS Simulator
             - configuration: debug
             - xcconfig_content: |-
                 CODE_SIGNING_ALLOWED=YES            
                 COMPILER_INDEX_STORE_ENABLE = NO
             - project_path: $BITRISE_PROJECT_PATH
       - deploy-to-bitrise-io
   ```
