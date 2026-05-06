---
title: "(Android) Deploy to Bitrise.io"
sidebar_position: 4
---

## Instructions

:::important[Deploying a release build]

If you want to deploy a release build, don't forget to set up code signing on Bitrise to build and sign the APK with your release key.

:::

1. Add the **Android Build** Step and set the following inputs:

   - **Build type**: Set this to **apk**.
   - **Variant**: Use `release`, `debug`, or one of your custom variants if you have any.
1. If you build a release variant, add the **Android Sign** Step.

   You can skip this if you plan to deploy an unsigned debug variant.
1. Add a **Deploy to Bitrise.io - Apps, Logs, Artifacts** Step.

## bitrise.yml

```
- android-build@1:
    inputs:
    - variant: release
    - build_type: apk
- sign-apk@1: {}
- deploy-to-bitrise-io@2: {}
```
