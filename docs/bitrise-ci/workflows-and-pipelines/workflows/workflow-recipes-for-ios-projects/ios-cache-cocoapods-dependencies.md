---
title: "(iOS) Cache CocoaPods dependencies"
sidebar_position: 1
---

## Description

Cache the content of the `Pods` folder of your iOS project.

## Instructions

1. Add the **[Bitrise.io Cache:Pull](https://www.bitrise.io/integrations/steps/cache-pull)** Step.
1. Add the **[Run CocoaPods install](https://www.bitrise.io/integrations/steps/cocoapods-install)** Step.
1. Add the **[Bitrise.io Cache:Push](https://www.bitrise.io/integrations/steps/cache-push)** Step.

   Optionally you can set **Compress Archive** to **true**. This is useful if your cached folders are bigger.

## bitrise.yml

```
- cache-pull@2: {}
- cocoapods-install@2: {}
- cache-push@2: {}
```
