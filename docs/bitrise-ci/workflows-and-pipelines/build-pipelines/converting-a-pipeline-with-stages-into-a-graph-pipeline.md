---
title: "Converting a Pipeline with stages into a graph Pipeline"
description: "You can convert your old, existing Bitrise Pipelines that contain stages into graph Pipelines without stages. This unlocks the full benefits of using Pipelines: faster build times, more granular configuration, and a full editing capability in the GUI of the Workflow Editor."
sidebar_position: 7
slug: /bitrise-ci/workflows-and-pipelines/build-pipelines/converting-a-pipeline-with-stages-into-a-graph-pipeline
---

You can convert your old, existing Pipelines that contain stages into graph Pipelines without stages. This unlocks the full benefits of using Pipelines: faster build times, more granular configuration, and a full editing capability in the GUI of the Workflow Editor.

To convert a Pipeline, you need to create a new Pipeline based on an old Pipeline. The old Pipeline won't be removed and it will still work if you need it so your builds will not break. You can switch to using the new Pipeline when all your configurations are ready for it.

:::note

Be aware that all new Pipeline features and improvements will only be available for graph Pipelines. Pipelines with stages will have no further features added.

:::

To convert a Pipeline

1. Open the Workflow Editor.
1. Open the dropdown menu at the top.
1. Click **Create Pipeline**.
1. Name your new Pipeline.
1. In the **Based on** dropdown menu, select a Pipeline that contains stages.
1. Click **Create Pipeline**.

   :::important[No cycles allowed]

   If your Pipeline conversion creates a cycle in the graph, you won't be able to save the Pipeline. You have to manually edit the configuration to remove the cycle, as they aren't allowed.

   :::

That's it: the new Pipeline will no longer have stages but will contain the same Workflows as the old one.
