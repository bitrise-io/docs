---
title: "(iOS) Deploy to Firebase App Distribution"
sidebar_position: 6
---

## Description

Build and distribute your app to testers via Firebase App Distribution.

## Prerequisites

1. An existing Firebase project where your exact bundle ID is registered. Follow the [Firebase documentation](https://firebase.google.com/docs/app-distribution/ios/distribute-console) for details.
1. Obtain a token from Firebase by running firebase `login:ci` locally. See the [Firebase CLI](https://firebase.google.com/docs/cli#sign-in-test-cli) docs for more details.
1. Add this token as a Secret to your Bitrise project with the name FIREBASE_TOKEN.
1. Get your Firebase App ID from your project's **General Settings** page and pass this value as an input variable to the **[BETA] Firebase App Distribution** Step.
1. You have code signing set up. See [iOS code signing](/en/bitrise-ci/code-signing/ios-code-signing.html) for more details.

## Instructions

1. Add the **[Xcode Archive & Export for iOS](https://www.bitrise.io/integrations/steps/xcode-archive)** Step and set the required input variables, such as **Scheme**, **Distribution method** and the desired code signing method.
1. Add the **[[BETA] Firebase App Distribution](https://github.com/guness/bitrise-step-firebase-app-distribution)** Step and set the following input variables:

   - **Firebase token**: use the secret env var previously defined: $FIREBASE_TOKEN.
   - **Firebase App ID**: see the Prerequisites section above for details.
   - Optionally, you can define test groups or individual testers in the Step input variables.

## bitrise.yml

```
- xcode-archive@6:
    inputs:
    - distribution_method: development
    - scheme: # your scheme goes here
    - automatic_code_signing: api-key
- firebase-app-distribution@0:
    inputs:
    - firebase_token: $FIREBASE_TOKEN
    - app: # your app ID from Firebase
    - testers: email@company.com # optional
    - groups: qa-team #optional
```
