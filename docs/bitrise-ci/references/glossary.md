---
title: "Glossary"
sidebar_position: 5
slug: /bitrise-ci/references/glossary
---

## Project {#project}

A Bitrise project is the container for the entire Mobile DevOps process of your development work. Each workspace can own multiple projects. A project allows you to create a CI configuration and set up Release Management to distribute your mobile app to testers and to online stores.

## Configuration YAML {#configuration-yaml}

The configuration YAML file stores your entire build configuration for a project. It specifies your stack and the build triggers, and defines the Workflows of the app. When you make changes on the graphical UI of our Workflow Editor, you actually modify your configuration YAML.

## bitrise.yml {#bitriseyml}

The configuration YAML file stores your entire build configuration for a project. It specifies your stack and the build triggers, and defines the Workflows of the app. When you make changes on the graphical UI of our Workflow Editor, you actually modify your configuration YAML.

## Pipeline {#pipeline}

A Bitrise Pipeline is the top level of the Bitrise CI/CD configuration. Pipelines can be used to organize the entire CI/CD process and to set up advanced configurations with multiple different tasks running parallel and/or sequentially.

## Project scanner {#project-scanner}

The project scanner is a tool that identifies the given project's type and generates a basic Bitrise configuration. Each supported project type has its own scanner: these scanners are stored as separate packages.

## Secret {#secret}

A Secret is a specific type of [Environment Variable](/en/bitrise-ci/configure-builds/environment-variables): they hide their information in an encrypted format and their value is not exposed in the build logs nor in the `bitrise.yml` configuration. You can store confidential information, such as passwords or API keys as Secrets.

## Stack {#stack}

A build stack indicates the full configuration of the virtual machine that Bitrise uses to run your build. Each stack includes an operating system, and a large number of pre-installed software and tools. For example, our Xcode stacks run on macOS operating systems and contain, among many other tools, the Xcode version that is indicated in the name of the stack.

## Stage {#stage}

A Stage is a collection of Workflows. Stages are the top-level building blocks of Pipelines. A Stage can contain multiple Workflows, which all run in parallel in the same Stage. If all Workflows are successful in a Stage, the Pipeline moves on to the next Stage. If any of the Workflows fail, the Pipeline ends without running the other Stages unless you configure a given Stage to always run.

## Step {#step}

A Step is a block of script execution that encapsulates a build task on Bitrise: the code to perform that task, the inputs and parameters you can define for the task, and the outputs the task generates.

## step.yml {#stepyml}

The interface definition of a Bitrise Step. It defines the Step inputs and the generated outputs, as well as any other Step property such as the category and the description of the Step. It also points to the Step's source code.

## Trigger {#trigger}

A trigger or build trigger is a configuration for automatically launching a Bitrise build when a specified event happens. Triggers require a webhook set up at your Git hosting provider.

## Workflow {#workflow}

A Workflow is a collection of Steps, Environment Variables, and other configurations. When Bitrise starts a build, it runs one or more Workflows according to the configuration defined in the `bitrise.yml` file.

## Workflow Editor {#workflow-editor}

The Bitrise Workflow Editor allows you to edit your Workflows, configure Steps, upload files (including code signing files) and manage your app's triggers and stacks on a graphical user interface. It is available both online and [offline](/en/bitrise-ci/bitrise-cli/installing-and-upgrading-the-offline-workflow-editor).

## Workspace {#workspace}

A Workspace is an environment that allows you to manage your Bitrise apps and the team members working on the apps. You can create multiple Workspaces, and you can be invited to Workspaces by other Bitrise users. To be able to add apps and run builds, you either need to be part of a Workspace, or you have to be an outside contributor on an app's team.
