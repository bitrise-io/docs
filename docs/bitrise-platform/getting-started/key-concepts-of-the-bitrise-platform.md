---
title: "Key concepts of the Bitrise platform"
description: "The Bitrise Mobile DevOps platform equips users for every step of the mobile development process, from planning to monitoring. It has a few key concepts that help understanding the overall structure of the platform."
sidebar_position: 2
slug: /bitrise-platform/getting-started/key-concepts-of-the-bitrise-platform
---

The Bitrise Mobile DevOps platform equips users for every step of the mobile development process, from planning to monitoring. It has a few key concepts that help understanding the overall structure of the platform.

## Workspaces

[A workspace](/en/bitrise-platform/workspaces/workspaces-overview) is an environment that allows you to manage your Bitrise projects and the team members working on the projects. To use any of the Bitrise product solutions, you need a workspace. Everything you see on the Bitrise Dashboard belongs to a selected workspace.

Workspaces have owners, managers, and members. They can be sorted into groups: groups allow owners to quickly assign large teams to specific projects.

## Projects

[A Bitrise project](/en/bitrise-platform/projects/projects-overview) is the container for the entire Mobile DevOps process of your development work. Each workspace can own multiple projects. A project allows you to:

- Create a CI configuration: a project's CI configuration is tied to a Git repository.
- Set up Release Management to distribute your mobile app to testers and to online stores.

Projects can add individual users and workspace groups as collaborators with granular access rights.

## Accounts

A user account belongs to an individual user. User accounts can't own projects: each user account must be part of a workspace to be able to work on the Bitrise platform.

User accounts don't have subscription plans or Release Management licenses: these are tied to workspaces, and Release Management apps, respectively.

You can invite individual users to both project teams and workspaces.
