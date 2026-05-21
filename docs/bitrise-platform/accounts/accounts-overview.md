---
title: "Accounts overview"
description: "When you sign up for Bitrise, you create your own individual user account. By itself, having a user account isn’t enough to add apps and run builds. For that, you must be part of a Workspace."
sidebar_position: 1
slug: /bitrise-platform/accounts/accounts-overview
sidebar_label: About personal accounts
---

When you sign up for Bitrise, you create your own individual user account. By itself, having a user account isn’t enough to add projects and run builds. For that, you must be part of a workspace or invited to a project as an outside contributor.

You can connect your personal account to:

- Your Git provider accounts via OAuth, allowing you to log in to Bitrise through your Git provider and to configure repository access for Bitrise CI: [Repository access with OAuth](/en/bitrise-platform/repository-access/repository-access-with-oauth).
- The Bitrise GitHub App, allowing authentication and repository access without the need for SSH keys: [GitHub app integration](/en/bitrise-platform/repository-access/github-app-integration).
- Your Apple ID, allowing you to connect Bitrise projects to an Apple service: [Connecting to an Apple service with Apple ID](/en/bitrise-platform/integrations/apple-services-connection/connecting-to-an-apple-service-with-apple-id).

## Account settings page

Your Bitrise account is managed from your [Account settings page](http://app.bitrise.io/me/account). From this page, you can:

- [Edit your profile](/en/bitrise-platform/accounts/editing-your-profile-settings.html), including username, email address, password, and avatar.
- Set up [Apple ID connection](/en/bitrise-platform/integrations/apple-services-connection/connecting-to-an-apple-service-with-apple-id#adding-apple-id-authentication-data-on-bitrise).
- [Enable two-factor authentication](/en/bitrise-platform/accounts/two-factor-authentication#enabling-two-factor-authentication).
- Connect [LaunchDarkly feature flags](/en/release-management/configuring-connected-apps/integrating-launchdarkly-feature-flags.html) for Release Management.
- Create and manage personal access tokens used to access the [Bitrise API](/en/bitrise-ci/api/api-overview.html).
- [Register test devices](/en/bitrise-ci/testing/testing-ios-apps/registering-a-test-device).

## SAML SSO

You can log in to Bitrise via SAML SSO. Bitrise supports multiple SAML identity providers. To log in via SAML SSO:

- Your workspace must have SAML SSO enabled.
- Make sure the email address belonging to your personal Bitrise account is also registered to your SAML identity provider.

For detailed information on how to set it up, see: [Configuring SAML SSO on Bitrise](/en/bitrise-platform/accounts/saml-sso-in-bitrise/configuring-saml-sso-on-bitrise).
