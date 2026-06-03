---
title: "(Flutter) Run Dart Analyzer"
sidebar_position: 7
---

## Description

Runs the Dart Analyzer for Flutter apps.

## Instructions

Add the **[Flutter Analyze](https://www.bitrise.io/integrations/steps/flutter-analyze)** Step to your Workflow.

## bitrise.yml

```
- flutter-analyze@0:
    inputs:
    - project_location: $BITRISE_FLUTTER_PROJECT_LOCATION
```
