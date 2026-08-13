import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebar: SidebarsConfig = {
  apisidebar: [
    {
      type: "doc",
      id: "release-management-api/code-push/api-reference/release-management-api-codepush",
    },
    {
      type: "category",
      label: "Deployments",
      items: [
        {
          type: "doc",
          id: "release-management-api/code-push/api-reference/list-code-push-deployments",
          label: "List deployments",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management-api/code-push/api-reference/create-code-push-deployment",
          label: "Create a deployment",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "release-management-api/code-push/api-reference/delete-deployment",
          label: "Delete a deployment",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "release-management-api/code-push/api-reference/get-code-push-deployment",
          label: "Get a deployment",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management-api/code-push/api-reference/update-code-push-deployment",
          label: "Update a deployment",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "release-management-api/code-push/api-reference/promote-code-push-package",
          label: "Promote a package",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "release-management-api/code-push/api-reference/rollback-code-push-package",
          label: "Rollback to the previous or a specific version",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "Updates",
      items: [
        {
          type: "doc",
          id: "release-management-api/code-push/api-reference/list-code-push-updates",
          label: "List updates",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management-api/code-push/api-reference/delete-update",
          label: "Delete an update",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "release-management-api/code-push/api-reference/get-code-push-update",
          label: "Get an update",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management-api/code-push/api-reference/patch-code-push-update",
          label: "Patche an update",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "release-management-api/code-push/api-reference/get-code-push-update-status",
          label: "Get the status of an update",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management-api/code-push/api-reference/get-code-push-update-upload-url",
          label: "Generate an upload url for an update",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management-api/code-push/api-reference/delete-code-push-staged-rollout-schedule",
          label: "Delete staged rollout schedule",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "release-management-api/code-push/api-reference/get-code-push-staged-rollout-schedule",
          label: "Get staged rollout schedule",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management-api/code-push/api-reference/create-code-push-staged-rollout-schedule",
          label: "Create staged rollout schedule",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "release-management-api/code-push/api-reference/pause-code-push-staged-rollout-schedule",
          label: "Pause staged rollout schedule",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "release-management-api/code-push/api-reference/resume-code-push-staged-rollout-schedule",
          label: "Resume staged rollout schedule",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "Metrics",
      items: [
        {
          type: "doc",
          id: "release-management-api/code-push/api-reference/get-code-push-metrics",
          label: "Get workspace level metrics",
          className: "api-method get",
        },
      ],
    },
  ],
};

export default sidebar.apisidebar;
