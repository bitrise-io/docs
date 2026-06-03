---
title: "Start (parallel) builds from the Workflow"
sidebar_position: 5
---

## Description

Start one or more builds in parallel with specified Workflows from a parent Workflow. You can add a Step to wait for their completion.

:::tip[Start builds for different apps]

Using this method, you can only start builds for the same app. If you would like to start another build for a different app, you can use the **[Trigger Bitrise workflow](https://www.bitrise.io/integrations/steps/trigger-bitrise-workflow)** Step.

:::

## Prerequisites

- Make sure you have a valid Bitrise API key in your [Secrets](/en/bitrise-ci/configure-builds/secrets) ($BITRISE_API_KEY). See [Personal access tokens](/en/bitrise-platform/accounts/personal-access-tokens) for more details.
- A Workflow or multiple Workflows you would like to run in parallel (for example, `workflow-1` and `workflow-2`).

## Instructions

1. Add a **[Bitrise Start Build](https://www.bitrise.io/integrations/steps/build-router-start)** Step. Set the following input variables:

   - **Workflows**: The Workflow(s) to start. Insert only one Workflow per line.
   - **Bitrise Access Token**: $BITRISE_API_KEY
1. (Optional) Add any Step you would like to run in parallel while the triggered Workflows are running in the parent Workflow.
1. (Optional) Add a **[Bitrise Wait for Build](https://www.bitrise.io/integrations/steps/build-router-wait)** Step. Set the **Bitrise Access Token** input variable: $BITRISE_API_KEY

## bitrise.yml

```
parent-workflow:
  steps:
  - build-router-start@0:
      inputs:
      - workflows: |-
          workflow-1
          workflow-2
      - access_token: "$BITRISE_API_KEY"
  - script@1:
      inputs:
      - content: echo "Doing something else..."
  - build-router-wait@0:
      inputs:
      - access_token: "$BITRISE_API_KEY"
```
