---
title: "About Pipelines"
description: "Pipelines allow you to define dependencies between your Workflows. This can reduce build time by running CI tasks in parallel whenever possible."
sidebar_position: 1
slug: /bitrise-ci/workflows-and-pipelines/build-pipelines/about-pipelines
---

A Bitrise Pipeline is the top level of our CI/CD configuration. Pipelines can be used to organize the entire CI/CD process and to set up advanced configurations with multiple different tasks running parallel and/or sequentially.

A Pipeline allows you to configure dependencies between Workflows. Each Workflow starts executing when its parent Workflows are done. Workflows on the same level are executed in parallel:

![pipeline-example.png](/img/_paligo/uuid-e85b689a-0101-6664-7f58-6e9ae5c851a7.png)

In this example, B and C are executed, in parallel, once A is successful. D is executed once B and C are both successful.

Read more about Pipelines:

- [Configuring a Bitrise Pipeline](/en/bitrise-ci/workflows-and-pipelines/build-pipelines/configuring-a-bitrise-pipeline)
- [Pipeline builds](/en/bitrise-ci/workflows-and-pipelines/build-pipelines/pipeline-builds)
- [Default Pipelines](/en/bitrise-ci/workflows-and-pipelines/build-pipelines/default-pipelines)
