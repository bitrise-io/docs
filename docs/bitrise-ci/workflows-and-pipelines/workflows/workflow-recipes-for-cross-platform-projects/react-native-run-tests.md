---
title: "(React Native) Run tests"
sidebar_position: 3
---

## Description

Run tests, for example, in Jest.

## Instructions

1. Add either the **[Run yarn command](https://www.bitrise.io/integrations/steps/yarn)** or the **[Run npm command](https://github.com/bitrise-steplib/steps-npm)** Step to your Workflow based on your project setup.
1. Set the **The yarn command to run** or **The npm command with arguments to run** input variable to `test`.

## bitrise.yml

Using `yarn`:

```yaml
- yarn@0:
    inputs:
    - command: test
```

Using `npm`:

```yaml
- npm@1:
    inputs:
    - command: test
```
