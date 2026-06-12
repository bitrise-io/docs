---
title: "Build machine types"
description: "Bitrise offers multiple build machines with different specifications. You can choose between them based on your needs."
sidebar_position: 4
---

Bitrise offers multiple build machines with different specifications You can choose between them based on your needs.

You can track how much time you spent building your apps on each machine type with Insights: [Bitrise CI metrics](/en/insights/available-metrics-in-insights/bitrise-ci-metrics).

:::tip[Machine availability by subscription plan]

Not all machines are available on all subscription plans. Visit [the pricing page](http://www.bitrise.io/pricing) to find out which machines are available on your plan!

:::

Machine types are divided into resource classes. The same resource class offers multiple machine types with broadly similar performances. Bitrise automatically assigns machine types from a resource class, which means that on the same day, your builds might run on different machine types.

:::tip

Use the machine type ID to set the machine type in your [configuration YAML](/en/bitrise-ci/configure-builds/configuring-build-settings/setting-the-stack-for-your-builds#setting-the-stack-in-the-configuration-yaml).

:::

| OS and resource class | Hardware types | Specs | Machine type ID |
| --- | --- | --- | --- |
| macOS Medium | M2 Pro Medium<br/>M4 Medium | 4 CPU @3.49GHz and 6 GB RAM<br/>5 CPU @4.4 GHz and 6 GB RAM | `g2.mac.medium` |
| macOS Large | M2 Pro Large<br/>M4 Large | 6 CPU @3.49GHz and 14 GB RAM<br/>5 CPU @4.4 GHz and 14 GB RAM | `g2.mac.large` |
| macOS X Large | M2 Pro X Large<br/>M4 X Large | 12 CPU @3.49GHz and 28 GB RAM<br/>10 CPU @4.4 GHz and 28 GB RAM | `g2.mac.x-large` |
| macOS 4Large | M4 Pro Large | 7 CPU @4.52GHz and 27 GB RAM | `g2.mac.4large` |
| macOS 4X Large | M4 Pro X Large | 14 CPU @4.52GHz and 54 GB RAM | `g2.mac.4x-large` |
| Linux Medium | | 4 vCPU @3.1 GHz and 16 GB RAM | `standard` |
| Linux Large | | 8 vCPU @3.1 GHz and 32 GB RAM | `elite` |
| Linux X Large | | 16 vCPU @3.1 GHz and 64 GB RAM | `elite-xl` |
| Linux M | AMD EPYC Zen 4 and Zen 5 | 4 vCPU @3.7 GHz and 16 GB RAM | `g2.linux.medium` |
| Linux 2M | AMD EPYC Zen 4 and Zen 5 | 6 vCPU @3.7 GHz and 24 GB RAM | `g2.linux.2medium` |
| Linux L | AMD EPYC Zen 4 and Zen 5 | 8 vCPU @3.7 GHz and 32 GB RAM | `g2.linux.large` |
| Linux 4L | AMD EPYC Zen 4 and Zen 5 | 14 vCPU @3.7 GHz and 56 GB RAM | `g2.linux.4large` |
| Linux XL | AMD EPYC Zen 4 and Zen 5 | 16 vCPU @3.7 GHz and 64 GB RAM | `g2.linux.x-large` |
| Linux 3XL | AMD EPYC Zen 4 and Zen 5 | 24 vCPU @3.7 GHz and 96 GB RAM | `g2.linux.3x-large` |
| Linux 5XL | AMD EPYC Zen 4 and Zen 5 | 32 vCPU @3.7 GHz and 128 GB RAM | `g2.linux.5x-large` |
| Linux 7XL | AMD EPYC Zen 4 and Zen 5 | 48 vCPU @3.7 GHz and 192 GB RAM | `g2.linux.7x-large` |
