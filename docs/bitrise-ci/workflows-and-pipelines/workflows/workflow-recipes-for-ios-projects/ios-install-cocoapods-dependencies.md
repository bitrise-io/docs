---
title: "(iOS) Install CocoaPods dependencies"
sidebar_position: 10
---

## Description

Install CocoaPods dependencies. Make sure that you are using the workspace and not the project file in your Steps. To do so, check the value of $BITRISE_PROJECT_PATH Env Var.

## Instructions

1. Add the **[Run CocoaPods install](https://www.bitrise.io/integrations/steps/cocoapods-install)** Step.
1. (Optional) If your Podfile is not in the root, set the **Podfile path** input variable.

## bitrise.yml

```
- cocoapods-install@2: {}
```
