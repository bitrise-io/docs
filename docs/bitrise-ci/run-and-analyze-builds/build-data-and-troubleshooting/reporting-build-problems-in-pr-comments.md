---
title: "Reporting build problems in PR comments"
sidebar_position: 6
slug: /bitrise-ci/run-and-analyze-builds/build-data-and-troubleshooting/reporting-build-problems-in-pr-comments
---

You can receive debugging information from Bitrise builds in Pull Request (PR) comments. This brings build insights directly into your PR timeline to accelerate problem resolutions and reduce context switching.

:::note[Service Credential User and PR comments]

Note that PR comments will be posted using a [service credential user account](https://docs.bitrise.io/en/bitrise-platform/integrations/the-service-credential-user.html) or the [Bitrise GitHub App](/en/bitrise-platform/repository-access/github-app-integration) if that is in use, rather than your personal account.

:::

## Configuring PR comments in Bitrise

Configure PR comments with just a few clicks:

1. Open your project on Bitrise with a user who has either the **Admin** role or the **Owner** role on the project.
1. On the main page of the project, click on the **Project settings** button.
1. Click **Integrations** on the left.
1. On the **Git provider** tab, scroll down to **Build reporting** and enable the toggle for **PR comments**.
1. If you wish to further edit the settings, click **Change settings**.

   ![project_settings_debugginginfoinPRs.png](/img/_paligo/uuid-5be9939f-1e31-2a9d-6c18-016f86734943.png)
1. In the **Configure PR comments**window, all information blocks are selected by default, but you can uncheck any that you do not want to include in PR comments. The information blocks are the following:

   - **Build summary**: Provides an overview of your build.
   - **Step failures**: Provides details on which build Steps failed and why.
   - **Test failures**: Provides information on failed tests.
   - **Flaky tests**: Provides insights into tests that are inconsistent.

     ![configurePRcomments_debugginginfoinPRcomments.png](/img/_paligo/uuid-5f7b1066-7b97-56e9-54c2-cd2094b7e2d5.png)
1. Under **Comment mode**, you can choose a comment mode to receive either a single comment or multiple comments.

   - **Single comment**: Each build on the PR replaces any existing comments from a previous build, so the PR displays only the comment from the most recent build.
   - **Multiple comments**: Each build on the PR adds a new comment, preserving a running history in the PR timeline.

     :::note[More on Comment mode]

     One PR build means one comment. However, multiple different Workflows on the same PR means multiple comments regardless of the **Comment mode** you choose. If the same Workflow is re-triggered, it adds new comments or updates the existing ones on the PR based on the chosen **Comment mode**.

     :::

## Receiving comments only for failed builds

If you have checked all the information blocks, you will receive a comment for both successful and failed builds. In this case, comments from successful builds will include a summary of the build. See examples below:

![reportingbuildproblemsfirstpic.png](/img/_paligo/uuid-91fa95b8-0325-7201-68ee-ddb01087718a.png)

![reportingbuildproblemssecondpic.png](/img/_paligo/uuid-33093867-a2c4-50e5-79ca-cf8fba179e41.png)

To prevent receiving comments on your successful builds from Bitrise, uncheck the “Build Summary” block and select the other boxes as needed. This way, you’ll only receive comments like below when there’s a problem in your build.

![reportingbuildproblemsthirdpic.png](/img/_paligo/uuid-74995bb5-af37-b70b-03e0-218fc8e978f7.png)

## FAQ about embedding debug information in PR commits

**Who is the author of these PR comments?**

This depends on the type of authentication. The [Service Credential User](https://docs.bitrise.io/en/bitrise-platform/integrations/the-service-credential-user.html) account posts comments if you [authenticate with the OAuth method](https://docs.bitrise.io/en/bitrise-platform/integrations/connecting-your-github-gitlab-bitbucket-account-to-bitrise.html). This applies for all Git providers, for example, Github, Gitlab, Bitbucket.

If you use the [Bitrise GitHub app](/en/bitrise-platform/repository-access/github-app-integration), the associated Bitrise bot will post the comment.

**Which Git providers are supported?**

All major Git providers—GitHub, GitLab, and Bitbucket — are supported.

**Will these comments appear for every PRs?**

It's an opt-in feature per project. Comments will only be posted if you have opted into this for the project.

**Will PR comments include full logs?**

No. Comments include concise error snippets and links back to the full build and Step logs on Bitrise. Use the link to open the Bitrise dashboard for the full context.

**What if it’s a pipeline build with many workflows? Will the comment show which Workflow the failing Step or test belongs to?**

If enabled, you will get one PR comment for the pipeline build. Information will be grouped per Workflow.

**Can I change settings per Workflow/Pipeline?**

No. It is a project-level setting and is not customizable per Workflow/Pipeline.

**What if I trigger multiple builds from the same PR? Will there be one comment or multiple comments?**

If you trigger multiple builds that are distinct (for example, a PR triggered three distinct pipelines A, B, and C), you will receive multiple comments.

If you trigger multiple builds that are the same (for example, a PR triggered the same pipeline twice, one after the other), then you will receive one comment if you selected **Single comment** mode, or multiple comments if you selected **Multiple comments** mode.
