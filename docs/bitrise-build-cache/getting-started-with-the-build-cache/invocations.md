---
title: "Invocations"
description: "Invocation is a key concept in remote caching, one that we use often in the guides. An invocation is a single Gradle or Bazel command execution. This means running a specific command to achieve a particular goal."
sidebar_position: 2
slug: /bitrise-build-cache/getting-started-with-the-build-cache/invocations
---

Invocation is a key concept in remote caching. An invocation is a single command execution. This means running a specific command to achieve a particular goal.

Invocations are only counted when the Bitrise Build Cache and/or analytics are enabled. Only cached invocations (invocations downloading data from the cache) are counted for billing purposes. Invocations not downloading data are not billed (free).

## Checking invocations

You can check the details of every single invocation in your cache history.

1. Open the Build Cache.
1. Select the tab of your build tool, either Gradle, Xcode, or Bazel.
1. Select your filter. You can filter for:

   - Dates
   - Bitrise projects
   - CI providers
   - Invocation status
   - Bitrise Workflow
1. In the invocation list, click the downward arrow to the left of any given invocation to see the basic information about it:

   ![2025-09-16-xcode-tab-invocations.png](/img/_paligo/uuid-e1c9e6b8-a0cf-6513-8b88-7ad65a2df1fe.png)

   - Invocation ID.
   - The CI provider used.
   - The build URL.

   If you use the Bitrise CI, you will see the Workflow and the Step in which the command was executed.
1. Click the arrow on the right to get to the details page of the invocation.

## Invocation details

The invocation details page shows:

- The command name and the event data of its invocation (such as CI provider, build tool, duration, cache hit rate).
- The critical path: the longest chain of dependent build tasks within an invocation. Executed cacheable tasks can be fixed to improve build cache performance.
- Uploads and downloads during the invocation. Large items or a high number of items increase invocation size. This can impact cache efficiency.

The details page allows you to compare the metrics of this invocation to the averages from the last 30 days for the same command:

![mygreat-project.png](/img/_paligo/uuid-3452d29c-7dd3-8a00-dbc3-c69620063c48.png)

If you use the Bitrise CI, the command card can take you to the project's build list:

![mygreat-project-name.png](/img/_paligo/uuid-79a85107-1f7e-60a6-6934-cbec5be94c28.png)

For even more invocation metrics, check out [Insights](/en/insights/available-metrics-in-insights/command-metrics.html).

## Comparing invocation differences

You can compare two command invocations side-by-side to quickly identify what changed between them. This helps debugging and failure root cause analysis.

For example, in Bitrise Insights you see an increase in command failure. You check which command started to fail. On the build cache page, you can check out the differences between two invocations of the command.

To check the differences:

1. Open the Build Cache.
1. Select the tab of your build tool, either Gradle, Xcode, or Bazel.
1. Set any filters you might need.
1. Click **Compare**.

   ![inv-compare.png](/img/_paligo/uuid-4e5bd057-700c-f047-f6ae-498ebd98f1a2.png)
1. Check the box to the right of the invocations you want to compare.
1. Click **Compare** to see the difference.

   ![invocation-diffing.png](/img/_paligo/uuid-d5bbba7f-b660-6c42-3745-ce80f0c72abf.png)

   In this example, you can immediately see that the duration of the more recent invocation has doubled compared to the previous one. You can dive in to the detailed comparison to see why.

   ![demo-wait-seconds-reason.png](/img/_paligo/uuid-ca915855-de3e-21af-a1d7-539b1020af65.png)

   The `demo.wait.seconds` Gradle property changed from 28 to 56.

:::tip[Invocation details]

You can also access the compare function [from the **Invocation details** page](#section-idm234872184294415): you can find the button in the top right corner of the page.

:::
