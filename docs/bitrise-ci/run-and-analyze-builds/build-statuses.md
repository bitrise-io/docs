---
title: "Build statuses"
description: "On the Builds page, you can track the current status of all your builds. There are six different build statuses: on hold, starting, running, aborted, failed, and success."
sidebar_position: 4
slug: /bitrise-ci/run-and-analyze-builds/build-statuses
---

On the **Builds** page of a project, you can track the current status of all your builds. There are six different build statuses:

- **On hold**: There are more builds started than what your current plan allows. In most cases, this is only relevant for legacy, concurrency-based plans: it means you don't have enough concurrency to start another build.

  :::note[Time limit]

  All builds on hold are aborted after 30 days to ensure no build gets permanently stuck.

  :::
- **Starting**: When a build is triggered, Bitrise creates a virtual machine to run it. If computing resources aren’t immediately available, the build is placed in a queue. Once a worker is available, the worker assigned to create the virtual machine is processing the build request.
- **Running**: Once a virtual machine is ready to go, the build starts running. This means that Bitrise is executing all the Steps defined in your Workflow.
- **Aborted**: A build can be aborted manually by the user, or automatically either by the [Rolling builds feature](/en/bitrise-ci/configure-builds/configuring-build-settings/rolling-builds) or because your build time has run out.

  :::note[Aborted with success]

  There is a specific status called Aborted with success: this means the build has been aborted by the API but it is reported as a success to your git hosting provider.

  Use the abort_with_success parameter with [a Bitrise API call to abort a build](/en/bitrise-ci/api/triggering-and-aborting-builds#aborting-a-build) but still count it as a successful one.

  :::
- **Failed**: In most cases, a build fails if any of the Steps fails. There are exceptions, such as the [caching Steps](/en/bitrise-ci/dependencies-and-caching/key-based-caching/using-key-based-caching), and you can [mark Steps as skippable](https://support.bitrise.io/hc/en-us/articles/4405252562577) which means even if they fail, the build will keep running.
- **Success**: If Bitrise successfully executes all Steps that aren’t marked as skippable, the build is marked as successful.

You can always check your build status on the **Builds** page of the project, and you can send status reports: [Reporting the build status to your Git hosting provider](/en/bitrise-ci/configure-builds/configuring-build-settings/reporting-the-build-status-to-your-git-hosting-provider)
