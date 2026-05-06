---
title: "(Flutter) Run tests"
sidebar_position: 5
---

## Description

Runs any test in a Flutter project.

## Instructions

1. Add the **[Flutter Test](https://www.bitrise.io/integrations/steps/flutter-test)** Step to your Workflow. Set the input variables:

   - **Project Location**: For example, $BITRISE_FLUTTER_PROJECT_LOCATION.
   - Check out optional inputs in the Workflow Editor or in the Step description.
1. Add a **[Deploy to Bitrise.io](https://www.bitrise.io/integrations/steps/deploy-to-bitrise-io)** Step that makes the test results available in the Tests tab.

## bitrise.yml

```
- flutter-test@1:
    inputs:
    - project_location: "$BITRISE_FLUTTER_PROJECT_LOCATION"
- deploy-to-bitrise-io@2: {}
```
