---
title: "Release Management roles and permissions"
description: "In Bitrise Release Management, users have permissions based on workspace-level roles and project-level roles. Each role has its own set of permissions. Workspace owners and project admins can manage most aspects of a Release Management app."
sidebar_position: 2
slug: /release-management/configuring-connected-apps/release-management-roles-and-permissions
sidebar_label: Roles and permissions
---

To perform actions in Release Management , your account must have the required access. This access is controlled by permissions. A permission is the ability to perform a specific action, such as adding and connecting apps, creating releases, or changing connected app settings.

## Roles and permissions overview

You can assign different roles to different team members. In Release Management, there are five different roles on three different levels:

- **Workspace-level roles**: These roles aren't tied to a specific Release Management app, nor can you change them in Release Management. [They are fully tied to the Workspace](/en/bitrise-platform/workspaces/collaboration-and-permissions-in-workspaces/workspace-collaboration) that owns the Bitrise project that the connected app belongs to. There are two Workspace-level roles:

  - **Workspace owner**: Workspace owners have full administrative control over all aspects of an app in Release Management, without any limits or exceptions.
  - **Workspace manager**: The main purpose of workspace managers is to manage workspace collaboration. In Release Management, they can add a new app when creating a new project. They, however, can't add a new RM app under an already existing project.
  - **Contributor** and **Viewer**: These Workspace-level roles have no default access to Release Management apps.
- **Project Admin**: The only [project-level role](/en/bitrise-platform/projects/roles-and-permissions-for-bitrise-ci.html) in Release Management. Adding a user to a project doesn't automatically give them any permissions in Release Management, with the exception of users with the Admin role. Project Admins have full administrative rights to apps, builds, Release Management, and app deployment with one exception: the Project Admin cannot add a new app with a new project to Release Management. When adding a new app to Release Management, they can only add it under the project of which they are admin.
- **Release Management-level roles**: These are the roles you can configure within Release Management.

  - **Release manager**: The main purpose of Release Managers is to handle releases to online stores. They can't add new apps or access app settings.
  - **App tester**: The App tester role is meant for internal testers. They can access an app and its artifacts, and the [build distribution](urn:resource:component:92118) and [tester groups](/en/release-management/build-distribution/tester-groups.html) menu. They have no other access.

## Roles and permissions for Release Management apps

| Actions | Workspace owner | Workspace manager | Project admin | Release manager | App tester |
| --- | --- | --- | --- | --- | --- |
| Access all apps of a project | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  |  |
| Access a specific app | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |
| Access app settings and integrations | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  |  |
| Access release presets | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  |  |
| Access artifacts | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |
| Access the list of release managers | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  |
| Access feature flags | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  |  |
| Add a new app to RM with a new project | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  |  |  |
| Add a new app to RM with an existing project | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  |  |
| Remove an app from RM | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  |  |
| Assign a license to an app | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  |  |
| Create, edit, and delete:  - Feature flag configuration - Release preset | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  |  |
| Upload artifacts | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  |

## Roles and permissions for build distribution and releases

| Action | Workspace owner | Workspace manager | Project admin | Release manager | App tester |
| --- | --- | --- | --- | --- | --- |
| Access the build distribution menu | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |
| Access the tester groups | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |
| Access the list of testers | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  |  |
| Enable the public install page | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  |
| Create, modify, and notify tester groups | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  |  |
| Update, approve, and delete assigned tasks | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  |  |
| Create, modify, pause, and delete releases | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  |
| Create and edit instructions for testers in the What to test field | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  |
| Create and modify store version and localization | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  |
| Submit release for review | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  |

## Roles and permissions for Bitrise CodePush

For more information on Bitrise CodePush click [here](https://docs.bitrise.io/en/release-management/codepush.html#bitrise-codepush).

| Action | Workspace owner | Workspace manager | Project admin | Release manager | App tester |
| --- | --- | --- | --- | --- | --- |
| Read CodePush deploy | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  |
| Read CodePush packages | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  |
| Create CodePush deploy | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  |  |
| Delete CodePush deploy | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  |  |
| Update CodePush deploy | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  |  |
| Upload CodePush packages | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  |
| Delete CodePush packages | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  |
| Update CodePush packages | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  |
| Promote CodePush packages | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  |
| Rollback CodePush packages | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  |
| Request CodePush access | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) | ![tick.svg](/img/_paligo/uuid-cff0066a-5a70-e7b4-5140-5dabde7188c2.png) |  |  |  |
