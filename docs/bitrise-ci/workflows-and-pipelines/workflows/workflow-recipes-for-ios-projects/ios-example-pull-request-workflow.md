---
title: "(iOS) Example Pull Request Workflow"
sidebar_position: 5
---

## Description

Example Workflow for iOS pull request validation. The Workflow contains:

1. Installing [Cocoapods](/en/bitrise-ci/workflows-and-pipelines/workflows/workflow-recipes-for-ios-projects/ios-cache-cocoapods-dependencies) and [Carthage](/en/bitrise-ci/workflows-and-pipelines/workflows/workflow-recipes-for-ios-projects/ios-install-carthage-dependencies) dependencies.
1. [Running all unit and UI tests on simulator](/en/bitrise-ci/workflows-and-pipelines/workflows/workflow-recipes-for-ios-projects/ios-run-tests-on-a-simulator).
1. [Building a test app and uploading to bitrise.io](/en/bitrise-ci/workflows-and-pipelines/workflows/workflow-recipes-for-ios-projects/ios-deploy-to-bitriseio).
1. [Sending the QR code of the test build to the pull request](/en/bitrise-ci/workflows-and-pipelines/workflows/generic-workflow-recipes/github-pull-request-send-the-build-qr-code).
1. Triggering the Workflow for pull requests.

## bitrise.yml

```
---
format_version: '11'
default_step_lib_source: https://github.com/bitrise-io/bitrise-steplib.git
project_type: ios
workflows:
  pull-request:
    steps:
    - activate-ssh-key@4:
        run_if: '{{getenv "SSH_RSA_PRIVATE_KEY" | ne ""}}'
    - git-clone@6: {}
    - cache-pull@2: {}
    - cocoapods-install@2: {}
    - carthage@3:
        inputs:
        - carthage_options: "--use-xcframeworks --platform iOS"
    - recreate-user-schemes@1:
        inputs:
        - project_path: "$BITRISE_PROJECT_PATH"
    - xcode-test@4:
        inputs:
        - log_formatter: xcodebuild
        - xcodebuild_options: "-enableCodeCoverage YES"
    - xcode-archive@4:
        inputs:
        - project_path: "$BITRISE_PROJECT_PATH"
        - scheme: "$BITRISE_SCHEME"
        - automatic_code_signing: apple-id
        - distribution_method: development
    - deploy-to-bitrise-io@2: {}
    - create-install-page-qr-code@1: {}
    - comment-on-github-pull-request@0:
        inputs:
        - body: |-
            ![QR code]($BITRISE_PUBLIC_INSTALL_PAGE_QR_CODE_IMAGE_URL)

            $BITRISE_PUBLIC_INSTALL_PAGE_URL
        - personal_access_token: "$GITHUB_ACCESS_TOKEN"
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
trigger_map:
- pull_request_source_branch: "*"
  workflow: pull-request
```
