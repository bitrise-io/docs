---
title: "(React Native) Cache dependencies (node_modules)"
sidebar_position: 1
---

## Description

Set up caching for dependencies (`node_modules` folder) of a React Native app.

## Instructions

1. Add the **[Bitrise.io Cache:Pull](https://www.bitrise.io/integrations/steps/cache-pull)**Step.
1. Add either the **[Run yarn command](https://www.bitrise.io/integrations/steps/yarn)** or the **[Run npm command](https://github.com/bitrise-steplib/steps-npm)** Step to your Workflow based on your project setup. Set the input variables:

   - Set the **The yarn command to run** or **The npm command with arguments to run** input variable to `install`.
   - Set **Cache node_modules** to `yes`.
1. Add the **[Bitrise.io Cache:Push](https://www.bitrise.io/integrations/steps/cache-push)** Step.
1. (Optional) Set the **Compress cache** input variable to `true`. This can be useful if your cache folders are large and you are experiencing slow build times.

## bitrise.yml

Using `yarn`:

```yaml
- cache-pull@2: {}
- yarn@0:
    inputs:
    - cache_local_deps: 'yes'
    - command: install
- cache-push@2:
    inputs:
    - compress_archive: 'true'
```

Using `npm`:

```yaml
- cache-pull@2: {}
- npm@1:
    inputs:
    - cache_local_deps: 'yes'
    - command: install
- cache-push@2:
    inputs:
    - compress_archive: 'true'
```
