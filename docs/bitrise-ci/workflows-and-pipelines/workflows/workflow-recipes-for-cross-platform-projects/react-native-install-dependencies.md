---
title: "(React Native) Install dependencies"
sidebar_position: 4
slug: /bitrise-ci/dependencies-and-caching/react-native-dependencies
sidebar_label: React Native dependencies
---

## Description

Install dependencies using either yarn or npm.

## Instructions

1. Add either the **[Run yarn command](https://www.bitrise.io/integrations/steps/yarn)** or the **[Run npm command](https://github.com/bitrise-steplib/steps-npm)** Step to your Workflow based on your project setup.
1. Set the **The yarn command to run** or **The npm command with arguments to run** input variable to `install`.

## bitrise.yml

Using `yarn`:

```yaml
- yarn@0:
    inputs:
    - command: install
```

Using `npm`:

```yaml
- npm@1:
    inputs:
    - command: install
```
