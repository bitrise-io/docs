---
title: "Getting started with the Bitrise platform"
description: "The Bitrise platform is organized around accounts, workspaces, and projects. We'll quickly go through how to start using them."
sidebar_position: 3
slug: /bitrise-platform/getting-started/getting-started-with-the-bitrise-platform
sidebar_label: Getting started with the platform
---

The Bitrise platform is organized around accounts, workspaces, and projects. We'll quickly go through how to start using them.

## Signing up

You can sign up via email or via one of three Git providers: GitHub, GitLab, or Bitbucket: [Signing up for Bitrise](/en/bitrise-platform/getting-started/signing-up-for-bitrise).

Bitrise also supports SAML SSO: [SAML SSO in Bitrise](/en/bitrise-platform/accounts/saml-sso-in-bitrise/configuring-saml-sso-on-bitrise).

After signing up, you receive a limited trial:

## First workspace

After signing up, we automatically create your first workspace. This workspace is owned by your user account. You can create additional workspaces at any point and be invited to other workspaces.

Workspaces are very important in Bitrise: all your work is organized in workspaces. You can:

- Add users and organize them into user groups: [Workspace collaboration](/en/bitrise-platform/workspaces/collaboration-and-permissions-in-workspaces/workspace-collaboration)
- Configure workspace-level integrations for third-party services such as the Apple Store or Google Play: [About integrations](/en/bitrise-platform/integrations/about-integrations).
- Create projects for Bitrise CI and Release Management.

## Projects

When you have your first workspace, you will be prompted to add your first project.

![gettingstarted.png](/img/_paligo/uuid-4f8203e0-c79b-b9ec-7537-53e96b0f1924.png)

There are two ways of creating a new project:

- Starting with Bitrise CI: you will be automatically taken to the **Add new project** flow. This creates a CI project with a linked Git repository: [Adding a new project](/en/bitrise-ci/getting-started/adding-a-new-project).
- Starting with Release Management: you can add a new app to Release Management and Bitrise will automatically link it to a new project: [Adding a new app to Release Management](/en/release-management/getting-started-with-release-management/adding-a-new-app-to-release-management).

  This project will not have a CI configuration but you can extend it with one.

Configure your project by entering **Project settings**. You can access it from both Bitrise CI and from Release Management.

## Integrations

Integrating to third-party tools and services is a vital part of the Mobile DevOps process. We recommend setting up the most important integrations once your first project is up and running:

- [The service credential user](/en/bitrise-platform/integrations/the-service-credential-user)
- [Repository access with OAuth](/en/bitrise-platform/repository-access/repository-access-with-oauth)
- [About connecting to Apple services](/en/bitrise-platform/integrations/apple-services-connection/about-connecting-to-apple-services)
- [Connecting a Google service account to Bitrise](/en/bitrise-platform/integrations/connecting-a-google-service-account-to-bitrise)
