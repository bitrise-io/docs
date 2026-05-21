---
title: "iOS code signing"
description: "To install your iOS app on a new device or to distribute your app to App Store, you will need to provide code signing files. The code signing of iOS projects requires signing certificates issued by Apple and provisioning profile file(s) matching your project."
sidebar_position: 1
slug: /bitrise-ci/code-signing/ios-code-signing/ios-code-signing
sidebar_label: iOS code signing overview
---

To install your iOS app on a new device or to [distribute your app to App Store](/en/bitrise-ci/deploying/ios-deployment/deploying-an-ios-app-to-app-store-connect.html), you will need to provide code signing files. The code signing of iOS projects requires:

- Signing certificates issued by Apple.
- Provisioning profile file(s) matching your project (team ID, bundle ID, and so on).

:::note[Broken builds]

If your builds break down and you suspect code signing issues, check out [our troubleshooting page](/en/bitrise-ci/code-signing/ios-code-signing/troubleshooting-ios-code-signing.html).

:::

| Methods | How it works | When to use it |
| --- | --- | --- |
| [Automatically managed provisioning profiles (recommended)](/en/bitrise-ci/code-signing/ios-code-signing/managing-ios-code-signing-files-automatic-provisioning) | You only need to upload the code signing certificate(s) to Bitrise and to establish an [Apple Service connection](/en/bitrise-platform/integrations/apple-services-connection/about-connecting-to-apple-services) (either via App Store Connect API key or through an Apple ID). Bitrise will download, create or renew the provisioning profile(s) and handle App ID and test device registration automatically. | This is the recommended option for most apps. With this option, managing your provisioning profiles is seamless and it's much easier to set up your Workflows. |
| [Manually managed provisioning profiles](/en/bitrise-ci/code-signing/ios-code-signing/managing-ios-code-signing-files-manual-provisioning) | You need to upload the code signing certificate(s) and also the provisioning profile(s) to Bitrise and keep the provisioning profile(s) updated with your iOS project. | Choose this option if:  - You cannot connect your App Store Connect API key or Apple ID to Bitrise. - You store or handle your code signing files in a unique way. - You wish to use code signing files from multiple Apple Developer Accounts.  You might also prefer this option if you are using an account with Apple Developer Enterprise Program. In this case only Apple ID-based authentication is supported. This has certain limitations: for example, needs to be renewed every 30 days. |
