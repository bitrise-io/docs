import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebar: SidebarsConfig = {
  apisidebar: [
    {
      type: "category",
      label: "Addons",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/addons-list",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/addons-show",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/addon-list-by-app",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/addon-list-by-organization",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/addon-list-by-user",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Application",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-list",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-show",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-delete",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-update",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-config-datastore-show",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/branch-list",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-change-connection-type",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-change-github-app-connection-configuration",
          className: "api-method put",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-change-linked-repositories",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-remove-repository-authorization",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-roles-query",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-roles-update",
          className: "api-method put",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-remove-service-credential-user",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-notifications",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-list-by-organization",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-list-by-user",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "App setup",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-create",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-config-create",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-setup-bitrise-yml-config-get",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-setup-bitrise-yml-config-update",
          className: "api-method put",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-finish",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/ssh-key-create",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-webhook-create",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "Android keystore file",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/android-keystore-file-list",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/android-keystore-file-create",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/android-keystore-file-show",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/android-keystore-file-delete",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/android-keystore-file-confirm",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "Builds",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/archived-builds-list",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/build-workflow-list",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/build-list",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/build-trigger",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/build-show",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/build-abort",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/build-bitrise-yml-show",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/build-log",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/build-list-all",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/build-ai-summary",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Build certificate",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/build-certificate-list",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/build-certificate-create",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/build-certificate-show",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/build-certificate-delete",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/build-certificate-update",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/build-certificate-confirm",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "Build request",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/build-request-list",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/build-request-update",
          className: "api-method patch",
        },
      ],
    },
    {
      type: "category",
      label: "Build artifact",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/artifact-list",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/artifact-show",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/artifact-delete",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/artifact-update",
          className: "api-method patch",
        },
      ],
    },
    {
      type: "category",
      label: "Key value cache",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/cache-list",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/cache-item-delete-all",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/cache-item-delete",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/cache-item-download",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Generic project file",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/generic-project-file-list",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/generic-project-files-create",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/generic-project-file-show",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/generic-project-file-delete",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/generic-project-file-update",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/generic-project-file-confirm",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "Outgoing webhook",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/outgoing-webhook-list",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/outgoing-webhook-create",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/outgoing-webhook-update",
          className: "api-method put",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/outgoing-webhook-delete",
          className: "api-method delete",
        },
      ],
    },
    {
      type: "category",
      label: "Webhook delivery item",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/webhook-delivery-item-list",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/webhook-delivery-item-show",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/webhook-delivery-item-redeliver",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "Pipelines",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/pipeline-list",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/pipeline-show",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/pipeline-abort",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/pipeline-rebuild",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/pipeline-list-all",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Provisioning profile",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/provisioning-profile-list",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/provisioning-profile-create",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/provisioning-profile-show",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/provisioning-profile-delete",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/provisioning-profile-update",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/provisioning-profile-confirm",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "Secrets",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/secret-list",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-secret-create",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-secrets-show",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/secret-upsert",
          className: "api-method put",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/secret-delete",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-secret-update",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/secret-value-get",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/organization-secrets-list",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/organization-secret-create",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/organization-secrets-show",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/organization-secret-delete",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/organization-secret-update",
          className: "api-method patch",
        },
      ],
    },
    {
      type: "category",
      label: "Test devices",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/test-device-list",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Configuration",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/available-stacks-list",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/organization-available-stacks-list",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/search-steps",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/step-inputs",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/validate-bitrise-yml",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "Groups",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/group-member-add",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "User",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/user-profile",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/user-machine-type-update",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/user-show",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Activity",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/activity-list",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Organizations",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/org-list",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/org-show",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/organization-machine-type-update",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/organization-group-list",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/organization-group-add",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/member-list",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/member-add",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "Apple api credentials",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/organizations-list-apple-api-credentials",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/organizations-create-apple-api-credentials",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/organizations-delete-apple-api-credentials",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/apple-api-credential-list",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Google service credentials",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/organizations-list-google-service-credentials",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/organizations-create-google-service-credentials",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/organizations-delete-google-service-credentials",
          className: "api-method delete",
        },
      ],
    },
  ],
};

export default sidebar.apisidebar;
