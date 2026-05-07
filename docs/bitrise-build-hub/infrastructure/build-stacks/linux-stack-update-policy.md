---
title: "Linux stack update policy"
sidebar_position: 4
slug: /bitrise-build-hub/infrastructure/build-stacks/linux-stack-update-policy
---

Linux stacks on Bitrise are based on Ubuntu LTS releases. Each Bitrise stack is based on one Ubuntu LTS version and never gets upgraded to another. Instead, we release new stacks and sunset older ones over time.

:::note[Previous version of a stack]

Updating a stack to a new version might cause problems with some builds. To help ease the transition, you can use the previous version of a stack for 2-3 days after an update: [Using the previous version of a stack](/en/bitrise-build-hub/infrastructure/build-stacks/stack-update-policy/using-the-previous-version-of-a-stack).

:::

For macOS specific information, check out [macOS stack update policy](/en/bitrise-build-hub/infrastructure/build-stacks/macos-stack-update-policy.html).

## Linux stack offerings

Bitrise offers multiple Linux stacks to handle different use-cases.

You can check the available stacks at any given time [here](https://bitrise.io/stacks/).

Each stack is based on one release of a Linux distribution. At the moment, we offer stacks based on Ubuntu LTS releases. Tools are installed on this base image, creating the Bitrise edition of a system.

The stack name and ID contains all of the above parameters and looks like this in practice:

- Name: Ubuntu Noble 24.04 - Bitrise 2025 Edition
- ID: `ubuntu-noble-24.04-bitrise-2025-android`

There are subtle differences between the different Linux stacks and their update frequency. You need to be aware of these details in order to pick the right stack and to avoid sudden broken builds.

## Linux stack updates

A new Bitrise edition and a new stack is created each year. This is always based on the latest Ubuntu LTS release.

Besides the new Ubuntu release, this new yearly Bitrise edition contains breaking changes that would have been too disruptive to ship in existing stacks. For example:

- Upgrading a preinstalled tool to a new version with breaking changes.
- When multiple versions of a tool are installed (for example, Ruby, Node.js,), removing an old version that reached its end-of-life and no longer receives security fixes.
- Configuration changes that could be breaking to some or all user workflows.

| Year of stack release | Stack name | Ubuntu base |
| --- | --- | --- |
| 2024 | Ubuntu Jammy 22.04 - Bitrise 2024 Edition | Ubuntu 22.04 LTS |
| 2025 | Ubuntu Noble 24.04 - Bitrise 2025 Edition | Ubuntu 24.04 LTS |
| **Future releases** (release codenames are unknown at this point) |  |  |
| 2026 | Ubuntu 26.04 - Bitrise 2026 Edition | Ubuntu 26.04 |
| 2027 | Ubuntu 26.04 - Bitrise 2027 Edition |  |
| 2028 | Ubuntu 28.04 - Bitrise 2028 Edition | Ubuntu 28.04 |
| 2029 | Ubuntu 28.04 - Bitrise 2029 Edition |  |

## Stack lifecycle

Similar to macOS Bitrise stacks, the Linux ones have the following lifecycle: Edge, Stable, Frozen, Removed.

A new stack is introduced as an edge stack first, then, after a year of testing and feedback, it becomes a stable stack. One year later it’s marked as frozen, then completely removed after one more year.

Different stages of a single stack:

![stack-state-change.svg](/img/_paligo/uuid-5169df38-e851-52da-fb4f-d37c3f98e8d8.svg)

Every year, around April and the release of the new Ubuntu version:

- A new stack is introduced as an edge stack.
- Last year’s edge stack becomes stable.
- Last year’s stable stack becomes frozen.
- Last year’s frozen stack gets removed.

Changing states presented with previous and future stacks:

![multiple-stack-state-change.svg](/img/_paligo/uuid-bcc68f5e-feec-8292-2e57-1bfb0dd9d9b9.svg)

Before a stack is removed, it’s flagged for removal, and you see the final removal date throughout the UI. Additionally, the remaining users of the stack receive an email notification from Bitrise.

## Which stack to choose?

At any given time, you can choose from at least one edge, stable and frozen stack. The following table helps make this choice:

|  | Edge | Stable | Frozen |
| --- | --- | --- | --- |
| Stable stack ID which can be included in bitrise.yml | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.svg) | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.svg) | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.svg) |
| Security updates to OS components, system libraries and preinstalled tools | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.svg) | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.svg) | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.svg) |
| Updates to OS components and system libraries | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.svg) | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.svg) | ![close-small.svg](/img/_paligo/uuid-5de915cb-051d-9584-d965-a36295c3f83c.svg) |
| Addition of new tools and tool versions | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.svg) | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.svg) | ![close-small.svg](/img/_paligo/uuid-5de915cb-051d-9584-d965-a36295c3f83c.svg) |
| Breaking changes in stack updates to existing tools and tool versions | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.svg) | ![close-small.svg](/img/_paligo/uuid-5de915cb-051d-9584-d965-a36295c3f83c.svg) | ![close-small.svg](/img/_paligo/uuid-5de915cb-051d-9584-d965-a36295c3f83c.svg) |
| New experimental features and configuration changes | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.svg) | ![close-small.svg](/img/_paligo/uuid-5de915cb-051d-9584-d965-a36295c3f83c.svg) | ![close-small.svg](/img/_paligo/uuid-5de915cb-051d-9584-d965-a36295c3f83c.svg) |
| Removal of tools and tool versions | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.svg) | ![close-small.svg](/img/_paligo/uuid-5de915cb-051d-9584-d965-a36295c3f83c.svg) | ![close-small.svg](/img/_paligo/uuid-5de915cb-051d-9584-d965-a36295c3f83c.svg) |

## Changelog

June 2025

**New**

Introduced the concept of Edge, Stable and Frozen stacks with regards to Linux, similar to the [macOS stack update policy](/en/bitrise-build-hub/infrastructure/build-stacks/macos-stack-update-policy.html). Defined the yearly cadence of new Linux stacks, as well as the deprecation and removal of older Linux stacks.
