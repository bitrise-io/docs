---
title: "Command metrics"
description: "Command metrics provides data-driven visibility into your Gradle and Bazel command performance. Command metrics are available as part of the [Bitrise Build Cache](https://bitrise.io/platform/devops/build-caching): if you have a working Build Cache setup, you will have access to these metrics in Insights."
sidebar_position: 2
slug: /insights/available-metrics-in-insights/command-metrics
---

Command metrics provides data-driven visibility into your Gradle and Bazel command performance. Command metrics are available as part of the [Bitrise Build Cache](https://bitrise.io/platform/devops/build-caching): if you have a working Build Cache setup, you will have access to these metrics in Insights.

:::note[Caching performance]

Even though command metrics are available only with the Bitrise Build Cache, they don't measure cache performance. For that, see [Build cache metrics](/en/insights/available-metrics-in-insights/build-cache-metrics).

:::

You can view command performance by logging into Insights and selecting **Commands** on the left navigation menu.

The following metrics are available:

- **Duration (p50 and p90)**: The duration metric measures command execution times. Knowing how long your commands are running help pinpoint bottlenecks, optimize build times, and improve productivity. For example, you can identify which commands are taking longer than expected and focus your optimization efforts there.
- **Error rate**: The rate of commands that fail. A lower error rate means more reliable builds and fewer disruptions to your CI/CD pipeline. High error rates on specific commands can flag a need for action, to dive deeper and resolve the cause of any instability.
- **Invocation count**: This metric measures how often specific Gradle and Bazel commands are executed. It can highlight commands that are overused or run reduntantly. If you see a certain command running too often, it may be worth investigating if you can restructure your pipeline to avoid overusing commands.

Like for any other metrics in Insights, you can:

- [Create a dashboard](/en/insights/getting-started-with-insights#the-dashboards-page).
- [Set alerts](/en/insights/configuring-alerts-in-insights) for specific thresholds.
