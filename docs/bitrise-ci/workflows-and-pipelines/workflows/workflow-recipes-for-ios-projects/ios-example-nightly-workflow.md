---
title: "(iOS) Example nightly Workflow"
sidebar_position: 7
---

## Description

Example Workflow for nightly builds for iOS apps. The Workflow contains:

1. Installing [Cocoapods](/en/bitrise-ci/workflows-and-pipelines/workflows/workflow-recipes-for-ios-projects/ios-cache-cocoapods-dependencies) and [Carthage](/en/bitrise-ci/workflows-and-pipelines/workflows/workflow-recipes-for-ios-projects/ios-install-carthage-dependencies) dependencies.
1. **[Setting the version and build number](https://www.bitrise.io/integrations/steps/set-ios-version)**. By default, the app will get the build number ($BITRISE_BUILD_NUMBER) as the version code.
1. [Building a release build and uploading to TestFlight](/en/bitrise-ci/workflows-and-pipelines/workflows/workflow-recipes-for-ios-projects/ios-deploy-to-app-store-connect-testflight).
1. [Building a test app and uploading to bitrise.io](/en/bitrise-ci/workflows-and-pipelines/workflows/workflow-recipes-for-ios-projects/ios-deploy-to-bitriseio).
1. [Sending the QR code of the test build to Slack](/en/bitrise-ci/workflows-and-pipelines/workflows/generic-workflow-recipes/iosandroid-send-qr-code-to-slack).

Check out our [guide](/en/bitrise-ci/run-and-analyze-builds/starting-builds/scheduling-builds) to run scheduled builds.

## bitrise.yml

```
---
format_version: '11'
default_step_lib_source: https://github.com/bitrise-io/bitrise-steplib.git
project_type: ios
workflows:
  nightly:
    steps:
    - activate-ssh-key@4:
        run_if: '{{getenv "SSH_RSA_PRIVATE_KEY" | ne ""}}'
    - git-clone@6: {}
    - cache-pull@2: {}
    - cocoapods-install@2: {}
    - carthage@3:
        inputs:
        - carthage_options: "--use-xcframeworks --platform iOS"
    - set-xcode-build-number@1:
        inputs:
        - build_short_version_string: '1.0'
        - plist_path: BitriseTest/Info.plist
    - recreate-user-schemes@1:
        inputs:
        - project_path: "$BITRISE_PROJECT_PATH"
    - xcode-archive@4:
        inputs:
        - project_path: "$BITRISE_PROJECT_PATH"
        - scheme: "$BITRISE_SCHEME"
        - automatic_code_signing: apple-id
        - distribution_method: app-store
    - deploy-to-itunesconnect-application-loader@1:
        inputs:
        - connection: apple_id
    - xcode-archive@4:
        inputs:
        - project_path: "$BITRISE_PROJECT_PATH"
        - scheme: "$BITRISE_SCHEME"
        - automatic_code_signing: apple-id
        - distribution_method: development
        - deploy-to-bitrise-io@2: {}
    - deploy-to-bitrise-io@2: {}
    - create-install-page-qr-code@1: {}
    - slack@3:
        inputs:
        - channel: "#build-notifications"
        - thumb_url: "$BITRISE_PUBLIC_INSTALL_PAGE_QR_CODE_IMAGE_URL"
        - webhook_url: "$SLACK_WEBHOOK"
    - cache-push@2: {}
app:
  envs:
  - opts:
      is_expand: false
    BITRISE_PROJECT_PATH: BitriseTest.xcworkspace
  - opts:
      is_expand: false
    BITRISE_SCHEME: BitriseTest
  - opts:
      is_expand: false
    BITRISE_DISTRIBUTION_METHOD: development
```
