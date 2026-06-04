---
title: "(iOS) Example CI Workflow"
sidebar_position: 3
---

## Description

Example Workflow for commits on the main branch of an iOS app. The Workflow contains:

1. Installing [Cocoapods](/en/bitrise-ci/workflows-and-pipelines/workflows/workflow-recipes-for-ios-projects/ios-install-cocoapods-dependencies) and [Carthage](/en/bitrise-ci/workflows-and-pipelines/workflows/workflow-recipes-for-ios-projects/ios-install-carthage-dependencies) dependecies.
1. [Running all unit and UI tests in simulator](/en/bitrise-ci/workflows-and-pipelines/workflows/workflow-recipes-for-ios-projects/ios-run-tests-on-a-simulator).
1. [Building a test app and uploading to bitrise.io](/en/bitrise-ci/workflows-and-pipelines/workflows/workflow-recipes-for-ios-projects/ios-deploy-to-bitriseio).
1. [Sending a Slack notification with the build status.](/en/bitrise-ci/workflows-and-pipelines/workflows/generic-workflow-recipes/iosandroid-send-build-status-to-slack)
1. [Filling the cache for upcoming pull request builds](/en/bitrise-ci/workflows-and-pipelines/workflows/generic-workflow-recipes/make-caching-efficient-for-pull-request-builds)

## bitrise.yml

```yaml
---
format_version: '11'
default_step_lib_source: https://github.com/bitrise-io/bitrise-steplib.git
project_type: ios
workflows:
  ci:
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
    - slack@3:
        inputs:
        - channel: "#build-notifications"
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
trigger_map:
- push_branch: main
  workflow: ci
```
