---
title: "Bitrise tools"
description: "A list of open source tools used and maintained by the Bitrise team."
sidebar_position: 4
slug: /bitrise-ci/references/bitrise-tools
---

Here is a list of our open source tools maintained by the Bitrise team.

| Name | Type | Description | Link |
| --- | --- | --- | --- |
| **Bitrise CLI** | CLI | The Bitrise CLI which is used on [bitrise.io](https://www.bitrise.io) to run builds. You can use it to run builds locally. | [https://github.com/bitrise-io/bitrise](https://github.com/bitrise-io/bitrise) |
| **stepman** | CLI tool | The Step Collection Manager used for managing the Step Library. | [https://github.com/bitrise-io/stepman](https://github.com/bitrise-io/stepman) |
| **envman** | CLI tool | The Environment Variable Manager used by the Bitrise CLI to isolate and manage [Environment Variables](/en/bitrise-ci/configure-builds/environment-variables.html) during the build. It can also be used independently of the Bitrise CLI. | [https://github.com/bitrise-io/envman](https://github.com/bitrise-io/envman) |
| **init** | CLI core plugin | Use this plugin so that our project scanner can detect the type of your project locally and generate a Bitrise configuration. | [https://github.com/bitrise-io/bitrise-plugins-init.git](https://github.com/bitrise-io/bitrise-plugins-init.git) |
| **step** | CLI core plugin | Use this plugin to list, retrieve Step information or create Steps. | [https://github.com/bitrise-io/bitrise-plugins-step](https://github.com/bitrise-io/bitrise-plugins-step) |
| **workflow-editor** | CLI core plugin | Use this plugin to configure your builds’ `bitrise.yml` config locally with the offline Workflow Editor. | [https://github.com/bitrise-io/bitrise-workflow-editor.git](https://github.com/bitrise-io/bitrise-workflow-editor.git) |
| **bitrise-plugin-io** | CLI core plugin | Use this plugin to manage your apps on [bitrise.io](https://www.bitrise.io) right from the Terminal / command line. | [https://github.com/bitrise-io/bitrise-plugins-io](https://github.com/bitrise-io/bitrise-plugins-io) |
| **bitrise webhooks** | Webhook processor | This [Bitrise Webhooks processor](https://github.com/bitrise-io/bitrise-webhooks) transforms various incoming webhooks (for example, from GitHub, Bitbucket, or Slack) to [bitrise.io](https://www.bitrise.io)’s Build Trigger API format, and calls it to start a build. | [https://github.com/bitrise-io/bitrise-webhooks](https://github.com/bitrise-io/bitrise-webhooks) |
