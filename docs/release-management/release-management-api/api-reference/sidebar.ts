import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebar: SidebarsConfig = {
  apisidebar: [
    {
      type: "category",
      label: "Apps",
      items: [
        {
          type: "doc",
          id: "release-management/release-management-api/api-reference/list-apps",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management/release-management-api/api-reference/create-app",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "release-management/release-management-api/api-reference/delete-app",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "release-management/release-management-api/api-reference/get-app",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management/release-management-api/api-reference/update-app",
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
          id: "release-management/release-management-api/api-reference/get-public-asset-status",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management/release-management-api/api-reference/generate-public-asset-upload-url",
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
          id: "release-management/release-management-api/api-reference/list-installable-artifacts",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management/release-management-api/api-reference/delete-installable-artifact",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "release-management/release-management-api/api-reference/get-installable-artifact",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management/release-management-api/api-reference/set-public-install-page",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "release-management/release-management-api/api-reference/get-installable-artifact-status",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management/release-management-api/api-reference/generate-installable-artifact-upload-url",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management/release-management-api/api-reference/get-what-to-test",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management/release-management-api/api-reference/update-what-to-test",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "release-management/release-management-api/api-reference/list-custom-access-links",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management/release-management-api/api-reference/create-custom-access-link",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "release-management/release-management-api/api-reference/delete-custom-access-link",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "release-management/release-management-api/api-reference/update-custom-access-link",
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
          id: "release-management/release-management-api/api-reference/get-presets-list",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management/release-management-api/api-reference/create-preset",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "release-management/release-management-api/api-reference/delete-preset",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "release-management/release-management-api/api-reference/get-presets",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management/release-management-api/api-reference/update-presets",
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
          id: "release-management/release-management-api/api-reference/create-draft-version",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "release-management/release-management-api/api-reference/get-draft-version",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Outgoing Webhooks",
      items: [
        {
          type: "doc",
          id: "release-management/release-management-api/api-reference/delete-outgoing-webhook",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "release-management/release-management-api/api-reference/get-outgoing-webhook",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management/release-management-api/api-reference/update-outgoing-webhook",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "release-management/release-management-api/api-reference/list-outgoing-webhook-deliveries",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management/release-management-api/api-reference/redeliver-outgoing-webhook",
          className: "api-method post",
        },
      ],
    },
  ],
};

export default sidebar.apisidebar;
