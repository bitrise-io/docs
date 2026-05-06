---
title: "(Android) Example CI Workflow"
sidebar_position: 5
---

## Description

Example Workflow for commits on the main branch of an Android app. The Workflow contains:

1. [Running unit tests](/en/bitrise-ci/workflows-and-pipelines/workflows/workflow-recipes-for-android-projects/android-run-unit-tests).
1. [Running UI tests on a virtual device](/en/bitrise-ci/workflows-and-pipelines/workflows/workflow-recipes-for-android-projects/android-run-instrumentation-tests-on-virtual-devices).
1. [Running Lint](/en/bitrise-ci/workflows-and-pipelines/workflows/workflow-recipes-for-android-projects/android-run-lint).
1. [Building a test app](/en/bitrise-ci/workflows-and-pipelines/workflows/workflow-recipes-for-android-projects/android-deploy-to-bitriseio).
1. [Sending a Slack notification with the build status](/en/bitrise-ci/workflows-and-pipelines/workflows/generic-workflow-recipes/iosandroid-send-build-status-to-slack).
1. Filling the cache for upcoming pull request builds.

## bitrise.yml

```
---
format_version: '11'
default_step_lib_source: https://github.com/bitrise-io/bitrise-steplib.git
project_type: android
workflows:
  ci:
    steps:
    - activate-ssh-key@4:
        run_if: '{{getenv "SSH_RSA_PRIVATE_KEY" | ne ""}}'
    - git-clone@6: {}
    - cache-pull@2: {}
    - android-unit-test@1:
        inputs:
        - project_location: $PROJECT_LOCATION
        - variant: $VARIANT
    - android-build-for-ui-testing@0:
        inputs:
        - variant: $VARIANT
        - module: $MODULE
    - virtual-device-testing-for-android@1:
        inputs:
        - test_type: instrumentation
    - android-lint@0:
        inputs:
        - variant: "$VARIANT"
    - android-build@1:
        inputs:
        - project_location: "$PROJECT_LOCATION"
        - module: "$MODULE"
        - variant: "$VARIANT"
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
    PROJECT_LOCATION: "."
  - opts:
      is_expand: false
    MODULE: app
  - VARIANT: debug
    opts:
      is_expand: false
trigger_map:
- push_branch: main
  workflow: ci
```
