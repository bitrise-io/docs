---
title: "Converting a Pipeline with stages into a graph Pipeline"
description: "You can convert your old, existing Bitrise Pipelines that contain stages into graph Pipelines without stages. This unlocks the full benefits of using Pipelines: faster build times, more granular configuration, and a full editing capability in the GUI of the Workflow Editor."
sidebar_position: 7
slug: /bitrise-ci/workflows-and-pipelines/build-pipelines/converting-a-pipeline-with-stages-into-a-graph-pipeline
---

You can convert your old, existing Pipelines that contain stages into graph Pipelines without stages. This unlocks the full benefits of using Pipelines: faster build times, more granular configuration, and a full editing capability in the Workflow Editor.

Pipelines with stages are read-only in the Workflow Editor. To edit them, you need to convert them first. The original Pipeline won't be removed and will still work after the conversion, so your builds won't break. You can switch to using the new Pipeline when all your configurations are ready.

:::note

All new Pipeline features and improvements will only be available for graph Pipelines. Pipelines with stages will have no further features added.

:::

To convert a Pipeline:

1. Open the Workflow Editor and select the Pipeline you want to convert.
1. Click **Convert Pipeline** in the banner at the top of the canvas.

   ![Convert Pipeline banner](/img/workflows-and-pipelines/2026-07-06-convert-pipeline-banner.png)

   Bitrise creates a converted copy named `<original-id>_converted` and selects it automatically.

1. Review and adjust the converted Pipeline as needed.

   :::important[No cycles allowed]

   If your Pipeline conversion creates a cycle in the graph, you won't be able to save the Pipeline. You have to manually edit the configuration to remove the cycle.

   :::

1. Click **Save changes** in the top right corner.
