---
title: "(iOS/Android) Send QR code to Slack"
sidebar_position: 4
---

## Description

Send a QR code of the iOS or Android build uploaded to bitrise.io to Slack.

## Prerequisites

- You have your iOS or Android app archived.
- You have set up a Slack webhook and added it to [Env Vars](/en/bitrise-ci/configure-builds/environment-variables.html) (for example, $SLACK_WEBHOOK). See [Configuring Slack integration](/en/bitrise-ci/configure-builds/configuring-build-settings/configuring-slack-integration) for details.

## Instructions

1. Add the [**Deploy to Bitrise.io - Apps, Logs, Artifacts**](https://www.bitrise.io/integrations/steps/deploy-to-bitrise-io) Step.
1. Add the [**Create install page QR code**](https://www.bitrise.io/integrations/steps/create-install-page-qr-code) Step.
1. Add the [**Send a Slack message**](https://www.bitrise.io/integrations/steps/slack) Step. Set the input variables:

   - **Slack Webhook URL**: for example, $SLACK_WEBHOOK.
   - **Target Slack channel, group or username**: for example, `#build-notifications`.
   - **A URL to an image file that will be displayed as a thumbnail**: $BITRISE_PUBLIC_INSTALL_PAGE_QR_CODE_IMAGE_URL.

## bitrise.yml

```
- deploy-to-bitrise-io@2: {}
- create-install-page-qr-code@1: {}
- slack@3:
    inputs:
    - channel: "#build-notifications"
    - thumb_url: $BITRISE_PUBLIC_INSTALL_PAGE_QR_CODE_IMAGE_URL
    - webhook_url: $SLACK_WEBHOOK
```
