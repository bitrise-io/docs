---
title: "Testing your app with Browserstack's App Automate"
description: "[BrowserStack](https://www.browserstack.com/)’s App Automate Espresso lets you test your native and hybrid apps on a variety of Android mobile and tablet devices. You can use App Automate in your Bitrise builds by utilizing our dedicated integration."
sidebar_position: 4
slug: /bitrise-ci/testing/testing-android-apps/testing-your-app-with-browserstack-s-app-automate
---

[BrowserStack](https://www.browserstack.com/)’s App Automate Espresso lets you test your native and hybrid apps on a variety of Android mobile and tablet devices. You can use App Automate in your Bitrise builds by utilizing our dedicated integration.

## Setting up App Automate Espresso

To configure the Browserstack integration:

1. Make sure you have a Browserstack Username and Access key.
1. On Bitrise, open the Workflow Editor and add the **Android Build for UI testing** Step to your Workflow.
1. Make sure the **Project location** input points to the root directory of your Android app.
1. Set the module and the variant you want to build in the **Module** and the **Variant** input.

   :::note[Gradle arguments]

   Optionally, you can pass additional Gradle arguments to the build task in the **Additional Gradle Arguments** input.

   :::
1. Add the **BrowserStack App Automate - Espresso** Step to your Workflow. It should follow the **Android Build for UI testing** Step.
1. Configure the required Step inputs:

   | Input group | Input name | Input value |
   | --- | --- | --- |
   | **Authentication** | **BrowserStack username** | Your BrowserStack username in a string format. |
   | **BrowserStack access key** | Your BrowserStack Access Key. |  |
   | **App & Test Suite** | **Android app under test** | The path to your test APK file. By default. you don't need to modify it: the **Android Build for UI testing** Step exports the path as an Env Var which is used as the default value. |
   | **Espresso test suite** | The path to your test suite file. By default. you don't need to modify it: the **Android Build for UI testing** Step exports the path as an Env Var which is used as the default value. |  |
   | **Devices** | **Devices** | Set to one or more device-OS combinations in a new line.  You can find the possible combinations [in this list](https://www.browserstack.com/list-of-browsers-and-platforms/app_automate). |
1. Optionally, [set advanced configuration options](#advanced-configuration-for-app-automate-espresso).

## Advanced configuration for App Automate Espresso

The **BrowserStack App Automate - Espresso** Step provides advanced configuration options. All of these options are available in the **Test configuration** input group.

| Input name | Description | Values |
| --- | --- | --- |
| **Filter tests** | Provide a comma-separated list of class or test names followed by supported filtering strategies.  Only the filtered test cases will be executed. | Key-value pairs of filters. Possible filters include: class, package, annotation, size.  For example: `class com.foo.AddToCartClass,class com.foo.CheckoutClass` |
| **Project name** | Provide [a project name](https://www.browserstack.com/docs/app-automate/espresso/organize-tests) for the tests.  You can logically group multiple Espresso test executions under a single project. This helps you easily access all related test executions on the App Automate dashboard on Browserstack. | A string. Valid characters are: letters (A-Z, a-z), digits (0-9), periods (.), colons (:), hiphens (-), square brackets ([]), forward slashes (/), asperands (@), ampersands (&amp;), single quotes (‘), and underscores (_).  Any other characters are ignored. |
| **Test sharding** | Enable [test sharding](https://www.browserstack.com/docs/app-automate/espresso/test-sharding) to split test cases into different groups instead of running them sequentially. | Set key-value pairs to specify the number of shards and configure its behaviour. There are three types of sharding strategies, each requiring different configuration:  - Auto strategy:    ```   {"numberOfShards": 2},    "devices": ["Google Pixel 3-9.0"]   ``` - Package strategy:    ```   {"numberOfShards": 2, "mapping":    [{"name": "Shard 1",    "strategy": "package",    "values": ["com.foo.login", "com.foo.logout"]},    {"name": "Shard 2",    "strategy": "package",    "values": ["com.foo.dashboard"]}]}   ``` - Class strategy:    ```   {"numberOfShards": 2, "mapping":    [{"name": "Shard 1",    "strategy": "class",    "values": ["com.foo.login.user", "com.foo.login.admin"]},    {"name": "Shard 2",    "strategy": "class",    "values": ["com.foo.logout.user"]}]}   ``` |
| **Single runner invocation** | Enable [single runner inovcation](https://www.browserstack.com/docs/app-automate/espresso/single-runner-invocation) to run all tests in a single instrumentation process to reduce overall build time. | `true` or `false`  The default value is `false`. |
| **Local testing** | Enable [Local testing](https://www.browserstack.com/docs/app-automate/espresso/get-started-with-local-testing) to retrieve app data hosted on local/private servers. | `true` or `false`  `false`  The default value is `false`. |
| **Mock server** | A mock web server mocks the behavior of an actual remote server. This makes it easy to test different scenarios without depending on your remote server and without having to make changes to your remote server.  Local testing will not work with a mock server. | `true` or `false`  The default value is `false`. |
