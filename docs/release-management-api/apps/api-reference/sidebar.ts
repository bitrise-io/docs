import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebar: SidebarsConfig = {
  apisidebar: [
    {
      type: "doc",
      id: "release-management-api/apps/api-reference/release-management-api",
    },
    {
      type: "category",
      label: "Apps",
      items: [
        {
          type: "doc",
          id: "release-management-api/apps/api-reference/list-apps",
          label: "Get a list of apps",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management-api/apps/api-reference/create-app",
          label: "Create an app",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "release-management-api/apps/api-reference/delete-app",
          label: "Delete an app",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "release-management-api/apps/api-reference/get-app",
          label: "Get an app",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management-api/apps/api-reference/update-app",
          label: "Update an app",
          className: "api-method patch",
        },
      ],
    },
    {
      type: "category",
      label: "Public Assets",
      items: [
        {
          type: "doc",
          id: "release-management-api/apps/api-reference/get-public-asset-status",
          label: "Get the status and reason of a public asset",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management-api/apps/api-reference/generate-public-asset-upload-url",
          label: "Generate a signed upload url valid for 1 hour for a public asset to be uploaded to Bitrise",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Installable Artifacts",
      items: [
        {
          type: "doc",
          id: "release-management-api/apps/api-reference/list-installable-artifacts",
          label: "Get the list of the installable artifacts",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management-api/apps/api-reference/delete-installable-artifact",
          label: "Delete an installable artifact",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "release-management-api/apps/api-reference/get-installable-artifact",
          label: "Get an installable artifact",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management-api/apps/api-reference/set-public-install-page",
          label: "Change whether public install page should be available for the installable artifact or not",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "release-management-api/apps/api-reference/get-installable-artifact-status",
          label: "Get the status and reason of an installable artifact",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management-api/apps/api-reference/generate-installable-artifact-upload-url",
          label: "Generate an upload url for an installable artifact",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management-api/apps/api-reference/get-what-to-test",
          label: "Get what to test information",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management-api/apps/api-reference/update-what-to-test",
          label: "Update what to test information",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "release-management-api/apps/api-reference/list-custom-access-links",
          label: "List custom access links for an installable artifact",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management-api/apps/api-reference/create-custom-access-link",
          label: "Create a custom access link for an installable artifact",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "release-management-api/apps/api-reference/delete-custom-access-link",
          label: "Delete a custom access link",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "release-management-api/apps/api-reference/update-custom-access-link",
          label: "Update a custom access link",
          className: "api-method patch",
        },
      ],
    },
    {
      type: "category",
      label: "Presets",
      items: [
        {
          type: "doc",
          id: "release-management-api/apps/api-reference/get-presets-list",
          label: "Get a list of preset templates",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management-api/apps/api-reference/create-preset",
          label: "Create a preset template",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "release-management-api/apps/api-reference/delete-preset",
          label: "Delete a preset template",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "release-management-api/apps/api-reference/get-presets",
          label: "Get a preset template",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management-api/apps/api-reference/update-presets",
          label: "Update the preset template",
          className: "api-method put",
        },
      ],
    },
    {
      type: "category",
      label: "Apple App Store",
      items: [
        {
          type: "doc",
          id: "release-management-api/apps/api-reference/create-draft-version",
          label: "Create an App Store review version",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "release-management-api/apps/api-reference/get-draft-version",
          label: "Get the App Store draft version",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management-api/apps/api-reference/update-draft-version",
          label: "Update the App Store draft version",
          className: "api-method patch",
        },
      ],
    },
    {
      type: "category",
      label: "Outgoing Webhooks",
      items: [
        {
          type: "doc",
          id: "release-management-api/apps/api-reference/delete-outgoing-webhook",
          label: "Delete an outgoing webhook",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "release-management-api/apps/api-reference/get-outgoing-webhook",
          label: "Get an outgoing webhook",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management-api/apps/api-reference/update-outgoing-webhook",
          label: "Update an outgoing webhook",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "release-management-api/apps/api-reference/list-outgoing-webhook-deliveries",
          label: "Get a list of outgoing webhook deliveries",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management-api/apps/api-reference/redeliver-outgoing-webhook",
          label: "Redeliver an outgoing webhook",
          className: "api-method post",
        },
      ],
    },
  ],
};

export default sidebar.apisidebar;
