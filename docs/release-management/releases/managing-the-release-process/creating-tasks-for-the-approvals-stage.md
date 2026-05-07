---
title: "Creating tasks for the approvals stage"
sidebar_position: 5
slug: /release-management/releases/managing-the-release-process/creating-tasks-for-the-approvals-stage
sidebar_label: Creating tasks for the Approvals stage
---

In the **Approvals** stage, you can create tasks for each stakeholder and/or team member whose approval is needed to continue with the release to the App Store Connect or Google Play.

Optionally, you can assign an approval task to a team member. Only the assigned team member can approve the task.

1. Open your release.
1. Select **Approvals** on the left navigation bar.

   ![approvalpage_tasks.jpg](/img/_paligo/uuid-1c68a37c-df87-a7ef-90e6-37ca83ac1ba2.jpg)
1. Click the **Add New Task** button.
1. Fill out the necessary fields:

   ![add_approval_task.png](/img/_paligo/uuid-97e3fccd-f3f6-fdc8-5f55-75f85a525e95.png)

   - **Title**: Identifies the task. This is required.
   - **Description**: A short summary of the task. This is optional.
   - **Assign to**: Select a team member to assign the task to. Only that team member will be able to approve the task. This is optional. Leave it on **(not assigned)** if you want anyone on the team to be able to approve the task.
   - **Due date**: Select a due date for the task's approval. This is optional.

You can create as many tasks as you want.

![approvalteam.png](/img/_paligo/uuid-2b430e36-ee56-c8ce-3599-f267c550062a.png)

After finishing a task in the approvals stage, you can tick it off using the checkbox next to the task. When all tasks have been ticked off, **Approvals** will be ticked off as well on the left navigation bar.

When done, you can proceed to:

- [The App Store Review stage](/en/release-management/releases/managing-the-release-process/sending-your-app-to-app-store-review.html) for iOS apps.
- [Releasing your app on Google Play](/en/release-management/releases/managing-the-release-process/releasing-your-app-on-google-play.html) for Android apps.

## Assigning an approval task to a team member with the REST API

You can assign an approval task to a team member with the help of our [Release Management API](https://docs.bitrise.io/en/release-management/release-management-api.html#release-management-api). For more information on our API endpoint, check out our [API docs](https://api-docs.bitrise.io/).

:::note[Limited access]

Note that you need a Personal Access Token or a Workspace token to [authenticate your API calls](https://docs.bitrise.io/en/bitrise-ci/api/authenticating-with-the-bitrise-api.html).

Only a [Workspace owner, a Project Admin and a Release Manager](https://docs.bitrise.io/en/release-management/configuring-connected-apps/release-management-roles-and-permissions.html) has the right to assign approval tasks to team members.

:::

You can create an approval task with the `POST /releases/{release_id}/approvals` endpoint by providing the user slug, due date, summary and a description.

You can update an approval task with the `PATCH /releases/{release_id}/approvals/{task_id}`endpoint.
