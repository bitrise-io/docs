---
title: "Cloning a Git repository"
sidebar_position: 2
---

## Description

Clone a Git repository.

## Instructions

1. Add the **[Activate SSH key (RSA private key)](https://github.com/bitrise-steplib/steps-activate-ssh-key)** Step. This allows the Git client on the build VM to access private repositories.
1. Add the **[Git Clone Repository](https://github.com/bitrise-steplib/steps-git-clone)** Step.

Check out other options in the Step documentation or in the Workflow Editor.

## bitrise.yml

```yaml
- activate-ssh-key@4:
    run_if: '{{getenv "SSH_RSA_PRIVATE_KEY" | ne ""}}'
- git-clone@6: {}
```
