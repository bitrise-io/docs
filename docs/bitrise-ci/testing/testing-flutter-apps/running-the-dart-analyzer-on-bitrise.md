---
title: "Running the Dart analyzer on Bitrise"
sidebar_position: 2
slug: /bitrise-ci/testing/testing-flutter-apps/running-the-dart-analyzer-on-bitrise
---

You can perform static analysis of your Flutter code with [the Dart analyzer](https://docs.flutter.dev/testing/debugging#the-dart-analyzer) by using the **Flutter Analyze** Step on Bitrise. The Step runs the `flutter analyze` command that makes heavy use of type annotations that you put in your code to help track problems down.

To run the analyzer:

Workflow Editor

bitrise.yml

1. Add the **Flutter Install** Step to your Workflow.

   This Step runs the initial setup of the Flutter SDK and installs any missing components.

   ![flutter-install-step.png](/img/_paligo/uuid-da8e56db-115d-1bff-d80e-d69e8fa5c1b6.png)
1. Make sure that the **Flutter Install** Step installs the correct version of the Flutter SDK for your app: check the **Flutter SDK Git repository version** input.

   ![flutter-install-step.png](/img/_paligo/uuid-da8e56db-115d-1bff-d80e-d69e8fa5c1b6.png)

   The input's default value is **stable**, which installs the latest stable version of the SDK. You can, however, set the value to either a specific version tag or a branch label:

   - You can find the available version tags here: [Version tags](https://github.com/flutter/flutter/tags).
   - You can find the available branch labels here: [Branch labels](https://github.com/flutter/flutter/branches).

   :::tip[Installation bundle URL]

   You can also install the Flutter SDK from an installation bundle URL: you just need to specify the URL in the **Flutter SDK installation bundle URL** input. Please note that if you do so, the **Flutter SDK Git repository version** input will be ignored entirely!

   :::
1. Add the **Flutter Analyze** Step to your Workflow.
1. Make sure the **Project Location** input points to the root directory of your Flutter project.

   - If the project scanner automatically detected it as a Flutter project when [adding it as an app](/en/bitrise-ci/getting-started/adding-a-new-project) on Bitrise, you don't have to change the default value.
   - If you configured the app manually, check that the location is correct.
1. Set the **Fail Severity** input to the desired level.

   The input determines the minimum severity to fail the Step. Any issue with a severity at least as high as the specified fails the Step. It has three possible settings, from minimum to maximum severity:

   - **info**: When this setting is selected, info-, warning-, and error-level issues all fail the Step.
   - **warning**: When this setting is selected, only warning- and error-level issues fail the Step.
   - **error**: This is the default value. Only error-level issues fail the Step.

   ![fail-severity.png](/img/_paligo/uuid-23a8ca33-3d33-1a67-07d4-273f1c69e194.png)
1. Optionally, add additional flag to the `flutter analyze` command in the **Additional Parameters** input.

   For a list of available flags, run `flutter help analyze`. For example, you can use the `--no-congratulate` flag if you don't want to see any output if there are no errors, warnings, hints or lints.

1. Add the `flutter-installer` Step to your Workflow.

   This Step runs the initial setup of the Flutter SDK and installs any missing components.

   ```
   primary:
     description: |
       Builds project and runs tests.
     steps:
       - activate-ssh-key: {}
       - git-clone: {}
       - flutter-installer:
           inputs:
   ```
1. Make sure that the Step installs the correct version of the Flutter SDK for your app: you can specify the version using the `version` input.

   The input's default value is `stable` which installs the latest stable version of the SDK. If you do not see the `version` input in your `bitrise.yml` file, it is set to the default value. You can, however, set the value to either a specific version tag or a branch label:

   - You can find the available version tags here: [Version tags](https://github.com/flutter/flutter/tags).
   - You can find the available branch labels here: [Branch labels](https://github.com/flutter/flutter/branches).

   ```
   # Installing version 3.7.7 of the Flutter SDK
   - flutter-installer:
       inputs:
       - version: 3.7.7
   ```

   :::tip[Installation bundle URL]

   You can also install the Flutter SDK from an installation bundle URL: you just need to specify the URL in the `installation-bundle-url` input. Please note that if you do so, the `version` input will be ignored entirely!

   The URL is expected to begin with `https://storage.googleapis.com/flutter_infra`. For example:

   ```
   - flutter-installer:
       inputs:
       - installation_bundle_url: https://storage.googleapis.com/flutter_infra/releases/beta/macos/flutter_macos_v1.6.3-beta.zip
   ```

   :::
1. Add the `flutter-analyze` Step to your Workflow.

   ```
   primary:
     description: |
       Builds project and runs tests.
     steps:
       - activate-ssh-key: {}
       - git-clone: {}
       - flutter-installer:
           inputs: 
           - version: stable
       - flutter-analyze:
           inputs:
   ```
1. Make sure the `project-location` input points to the root directory of your Flutter project.

   ```
   - flutter-analyze:
       inputs:
       - project_location: "$BITRISE_SOURCE_DIR"
   ```

   - If the project scanner automatically detected it as a Flutter project when [adding it as an app](/en/bitrise-ci/getting-started/adding-a-new-project) on Bitrise, you don't have to change the default value.
   - If you configured the app manually, check that the location is correct.
1. Set the `fail_severity` input to the desired level.

   The input determines the minimum severity to fail the Step. Any issue with a severity at least as high as the specified fails the Step. It has three possible settings, from minimum to maximum severity:

   - `info`: When this setting is selected, info-, warning-, and error-level issues all fail the Step.
   - `warning`: When this setting is selected, only warning- and error-level issues fail the Step.
   - `error`: This is the default value. Only error-level issues fail the Step.

   ```
   - flutter-analyze:
       inputs:
       - project_location: "$BITRISE_SOURCE_DIR"
       - fail_severity: error
   ```
1. Optionally, add additional flag to the `flutter analyze` command in the `additional_params` input.

   For a list of available flags, run `flutter help analyze`. For example, you can use the `--no-congratulate` flag if you don't want to see any output if there are no errors, warnings, hints or lints.

   ```
   - flutter-analyze:
       inputs:
       - project_location: "$BITRISE_SOURCE_DIR"
       - fail_severity: error
       - additional_params: --no-congratulate
   ```

Once your build has run, you can check the Step's output in the [build logs](/en/bitrise-ci/run-and-analyze-builds/build-data-and-troubleshooting/build-logs).
