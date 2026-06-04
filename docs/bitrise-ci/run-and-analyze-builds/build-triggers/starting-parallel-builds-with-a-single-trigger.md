---
title: "Starting parallel builds with a single trigger"
description: "You can start multiple parallel builds by using the Bitrise Start for Build and the Bitrise Wait for Build Steps."
sidebar_position: 4
slug: /bitrise-ci/run-and-analyze-builds/build-triggers/starting-parallel-builds-with-a-single-trigger
---

:::tip[Using Build Pipelines to start parallel builds with a single trigger]

If you have a credit-based account and you are planning on running multiple tasks parallel with a single trigger, we recommend using Build Pipelines. For more information, check out [Build Pipelines](/en/bitrise-ci/workflows-and-pipelines/build-pipelines/pipelines-with-stages/configuring-a-pipeline-with-stages).

:::

If you have more than one concurrency or you have a credit-based account, you can run more than one build simultaneously. And since we want to make life as easy for you as possible, these builds can be started automatically, with a single trigger. Let’s go through how it works!

In the example, we have three Workflows of a single app set up to run at the same time. Let’s call these Workflows **Trigger**, **Building** and **Testing**. The workflow called **Trigger** will be triggered by a pull request, and then the workflow will trigger **Building** and **Testing** which will run simultaneously.

All workflows run on separate, clean Virtual Machines. They can also run on different types of stacks: to choose the stack for any Workflow, go to the Workflow Editor of the app and select the **Stack** tab.

If any of the builds fail, the build will be considered a failed build. If the build is triggered by a webhook, Bitrise will send [a summarized build result](/en/bitrise-ci/configure-builds/configuring-build-settings/reporting-the-build-status-to-your-git-hosting-provider) to your Git provider. If any of the parallel builds fail, a failed status will be reported.

:::important[No reports for "child" builds]

Bitrise will send a Git status report only for the original "parent" build, the one that triggered all the other builds. The "child" builds will not send back status reports to your Git provider!

For example, if build A triggers builds B and C, a status report will be sent once A is finished. There will be no separate status reports for builds B and C, however.

:::

What you need:

- A Personal Access Token.
- A Secret Environment Variable storing the token.
- The **Bitrise Start Build** Step.
- The **Bitrise Wait for Build** Step.

:::important[Bitrise Start Build Step on the CI]

Since the **Bitrise Build Start** Step heavily relies on the parameters of the currently running build (for example, the app slug, build slug and the build number) to call the [see topic](urn:resource:component:43135), you cannot use the **Bitrise Build Start** Step locally.

:::

:::tip[bitrise.yml example]

You can edit your `bitrise.yml` file on the **bitrise.yml** tab of the Workflow Editor, or you can edit the file locally. The example below focuses on the Bitrise UI, but if you prefer to use YAML format, [check out our example](#bitriseyml-example)!

:::

1. Create a **Personal Access Token** for your user.

   Go to **Profile Settings** and select the **Security** option on the left side. Click the **Generate new** button.

   ![Starting_parallel_builds_with_a_single_trigger.png](/img/_paligo/uuid-35a66242-8cc5-8b66-380d-a996c3012825.png)

   :::warning[Copying the token]

   Make sure the copy the token once it's generated: you won't be able to see it again!

   :::
1. Create a Secret Environment Variable on the **Secrets** tab of the app’s Workflow Editor and add the token as its value.

   ![Starting_parallel_builds_with_a_single_trigger.png](/img/_paligo/uuid-d85ee7fd-2f40-5ae8-34ce-c79f638f3879.png)

   Feel free to use any key you wish for the secret. We recommend something simple like $ACCESS_TOKEN.
1. Add the **Bitrise Start Build** Step to the **Trigger** Workflow.

   Note that the **Bitrise Start Build** Step will set an Environment Variable to all builds it starts: $SOURCE_BITRISE_BUILD_NUMBER. Each build triggered by the Step will have their own build numbers but the source build number will be the same for all of them.
1. Add the secret env storing your personal access token to the **Bitrise Access Token** input of the Step: click the **Select secret variable** button and choose the key you created.

   ![Starting_parallel_builds_with_a_single_trigger.png](/img/_paligo/uuid-f9f9d575-5b1f-73c1-53ae-94ae13e0da3f.png)
1. Find the **Workflows** input of the Step, and add `Building` and `Testing` to it.

   ![Starting_parallel_builds_with_a_single_trigger.png](/img/_paligo/uuid-41d604b4-d929-893c-2ac9-aa44b3e01e85.png)
1. Add the **Bitrise Wait for Build** Step as the last Step of the **Trigger** Workflow.

   :::important[Checking build statuses]

   The Step checks statuses of the builds defined in the Step. The builds are defined in the **Build slugs** input: the slugs are the output of the **Bitrise Start Build** Step. As long as the builds defined by the slugs are running, the Step will hold the build it is running in. The build will fail if any of the builds included in the Step fail.

   :::
1. Add the secret env storing your personal access token to the **Bitrise Access Token** input of the Step: click the **Select secret variable** button and choose the key you created.

   ![Starting_parallel_builds_with_a_single_trigger.png](/img/_paligo/uuid-ed66ae06-8ebc-cb93-e3e3-ce6c2e94b1de.png)

And you are done! Once you trigger the **Trigger** workflow, the **Bitrise Start Build** Step of the Workflow will trigger two more builds running simultaneously. If those two builds are successful, the **Bitrise Wait for Build** Step lets the first build finish. A single status report is sent to the git hosting provider, regardless whether the build is successful or not.

## bitrise.yml example

```yaml
Trigger:
  steps:
  - build-router-start@0:
      inputs:
      - workflows: |-
          Building
          Testing
      - access_token: "$BITRISE_API_KEY"
  - build-router-wait@0:
      inputs:
      - access_token: "$BITRISE_API_KEY"
```
