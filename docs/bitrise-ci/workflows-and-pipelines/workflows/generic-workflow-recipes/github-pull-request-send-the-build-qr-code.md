---
title: "GitHub pull request: send the build QR code"
sidebar_position: 7
---

## Description

Send a comment to the GitHub pull request with a QR code to the build uploaded to bitrise.io.

## Prerequisites

- You have your iOS or Android app archived.
- You have a GitHub personal access token with the `repo` scope and you've added it as a [Secret](/en/bitrise-ci/configure-builds/secrets) ($GITHUB_ACCESS_TOKEN) to your Bitrise app.

## Instructions

1. Add the **[Deploy to Bitrise.io - Apps, Logs, Artifacts](https://www.bitrise.io/integrations/steps/deploy-to-bitrise-io)** Step.
1. Add the **[Create install page QR code](https://www.bitrise.io/integrations/steps/create-install-page-qr-code)** Step.
1. Add the **Comment on GitHub Pull Request** Step and set the following input variables:

   - **GitHub personal access token**: Set it to the previously created Secret, $GITHUB_ACCESS_TOKEN.
   - **Body**: Add the following:

     ```
     ![QR code]($BITRISE_PUBLIC_INSTALL_PAGE_QR_CODE_IMAGE_URL)

     $BITRISE_PUBLIC_INSTALL_PAGE_URL
     ```

## bitrise.yml

```
- deploy-to-bitrise-io@2: {}
- create-install-page-qr-code@1: {}
- comment-on-github-pull-request@0:
    inputs:
    - body: |-
        ![QR code]($BITRISE_PUBLIC_INSTALL_PAGE_QR_CODE_IMAGE_URL)

        $BITRISE_PUBLIC_INSTALL_PAGE_URL
    - personal_access_token: "$GITHUB_ACCESS_TOKEN"
```
