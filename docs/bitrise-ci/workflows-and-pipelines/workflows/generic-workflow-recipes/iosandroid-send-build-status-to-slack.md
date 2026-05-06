---
title: "(iOS/Android) Send build status to Slack"
sidebar_position: 1
---

## Description

Send a message to Slack with the build status after a build has finished.

## Prerequisites

You have set up a Slack webhook and added it to [Env Vars](/en/bitrise-ci/configure-builds/environment-variables.html) (for example, $SLACK_WEBHOOK). See [Configuring Slack integration](/en/bitrise-ci/configure-builds/configuring-build-settings/configuring-slack-integration) for details.

## Instructions

Add the **[Send a Slack message](https://www.bitrise.io/integrations/steps/slack)** Step. Set the input variables:

- **Slack Webhook URL**: for example, $SLACK_WEBHOOK.
- **Target Slack channel, group or username**: for example, `#build-notifications`.

Check out other options in the Step documentation or in the Workflow Editor.

## bitrise.yml

```
- slack@3:
    inputs:
    - channel: "#build-notifications"
    - webhook_url: $SLACK_WEBHOOK
```
