---
title: "(iOS) Example Release Workflow"
sidebar_position: 12
---

## Description

Example Workflow for uploading a release draft of an iOS app to the App Store. The Workflow contains:

1. Installing [Cocoapods](/en/bitrise-ci/workflows-and-pipelines/workflows/workflow-recipes-for-ios-projects/ios-cache-cocoapods-dependencies) and [Carthage](/en/bitrise-ci/workflows-and-pipelines/workflows/workflow-recipes-for-ios-projects/ios-install-carthage-dependencies) dependencies.
1. [Setting the version number](https://www.bitrise.io/integrations/steps/set-ios-version) based on [Env Vars passed to build](/en/bitrise-ci/configure-builds/environment-variables#setting-a-custom-env-var-when-starting-a-build) ($VERSION_NUMBER).
1. [Building a release build and uploading to App Store](/en/bitrise-ci/workflows-and-pipelines/workflows/workflow-recipes-for-ios-projects/ios-deploy-to-app-store-connect-testflight).

## bitrise.yml

```
---
format_version: '11'
default_step_lib_source: https://github.com/bitrise-io/bitrise-steplib.git
project_type: ios
workflows:
  release:
    steps:
    - activate-ssh-key@4:
        run_if: '{{getenv "SSH_RSA_PRIVATE_KEY" | ne ""}}'
    - git-clone@6: {}
    - cocoapods-install@2: {}
    - carthage@3:
        inputs:
        - carthage_options: "--use-xcframeworks --platform iOS"
    - set-xcode-build-number@1:
        inputs:
        - build_short_version_string: "$VERSION_NUMBER"
        - build_version: "$BITRISE_BUILD_NUMBER"
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
