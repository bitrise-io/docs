---
title: "(iOS) Deploy to bitrise.io"
sidebar_position: 4
---

## Description

Build and distribute your app to testers via Bitrise.io Ship.

## Prerequisites

You have code signing set up. See [iOS code signing](/en/bitrise-ci/code-signing/ios-code-signing/creating-a-signed-ipa-for-xcode-projects) for more details.

## Instructions

1. Add the **[Xcode Archive & Export for iOS](https://www.bitrise.io/integrations/steps/xcode-archive)** Step. Set the input variables:

   - **Project path**: by default, $BITRISE_PROJECT_PATH.
   - **Scheme**: by default, $BITRISE_SCHEME.
   - **Distribution method**: **development**, **ad-hoc** or **enterprise**.
1. Add the **[Deploy to Bitrise.io - Apps, Logs, Artifacts](https://www.bitrise.io/integrations/steps/deploy-to-bitrise-io)** Step.

## bitrise.yml

```
- xcode-archive@4:
        inputs:
        - project_path: "$BITRISE_PROJECT_PATH"
        - scheme: "$BITRISE_SCHEME"
        - automatic_code_signing: apple-id
        - distribution_method: development
   - deploy-to-bitrise-io@2: {}
```
