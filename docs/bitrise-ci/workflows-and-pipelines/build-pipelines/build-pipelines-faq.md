---
title: "Build Pipelines FAQ"
description: "Frequently asked questions about the Pipeline feature on Bitrise."
sidebar_position: 5
slug: /bitrise-ci/workflows-and-pipelines/build-pipelines/build-pipelines-faq
sidebar_label: Pipeline Management FAQ
---

**Can I use Pipelines if I store my bitrise.yml file in my own repository?**

Yes, absolutely. It makes no difference to Pipelines.

**How can I set the stack for my Pipeline?**

In the current version, you can set the default stack for your app, or you can set Workflow-specific stacks, just like with standalone builds: [Setting the stack for your builds](/en/bitrise-ci/configure-builds/configuring-build-settings/setting-the-stack-for-your-builds).

**How can I use Environment Variables with a Pipeline?**

You can keep using project-level and Workflow-level [Environment Variables](/en/bitrise-ci/configure-builds/environment-variables).

**Can I rerun a failed Pipeline?**

Yes. Go to the **Pipeline details** page, and click the **Rebuild** button. From there you have the option to rebuild unsuccessful Workflows or to rebuild the entire Pipeline. Both options are also available with remote access.

**Does the Rolling Builds feature work on Pipelines?**

Yes! You don’t have to worry about wasting credits with builds that are no longer necessary because of new commits or pull requests.
