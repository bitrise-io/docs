---
title: "(iOS) Install Carthage Dependencies"
sidebar_position: 11
---

## Description

Install Carthage dependencies.

## Instructions

Add the **[Carthage](https://www.bitrise.io/integrations/steps/carthage)** Step. Set the input variables:

- **Github Personal Access Token**: We recommend adding a GitHub access token to your **Secrets** ($GITHUB_ACCESS_TOKEN). We need this token to avoid GitHub rate limit issue. See the GitHub guide: [Creating an access token for command-line use](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) on how to create Personal Access Token. Uncheck every scope box when creating this token. There is no reason this token needs access to private information.
- (Optional) Set **Additional options for carthage command**: see the [Carthage docs](https://github.com/Carthage/Carthage) for the available options, for example, `--use-xcframeworks --platform iOS`.

:::tip[Setting a specific Carthage version in your builds]

If your project needs a Carthage version currently unavailable on our stacks, check out [Setting a specific Carthage version in your builds](https://support.bitrise.io/hc/en-us/articles/360018894138-Setting-a-specific-Carthage-version-in-your-builds).

:::

## bitrise.yml

```yaml
- carthage@3:
    inputs:
    - carthage_options: "--use-xcframeworks --platform iOS"
```
