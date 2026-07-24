import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebar: SidebarsConfig = {
  apisidebar: [
    {
      type: "doc",
      id: "bitrise-api/api-reference/bitrise-api",
    },
    {
      type: "category",
      label: "addons",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/addons-list",
          label: "Get list of available Bitrise addons",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/addons-show",
          label: "Get a specific Bitrise addon",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/addon-list-by-app",
          label: "Get list of the addons for apps",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/addon-list-by-organization",
          label: "Get list of the addons for organization",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/addon-list-by-user",
          label: "Get list of the addons for user",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "application",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-list",
          label: "Get list of the apps",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-show",
          label: "Get a specific app",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-delete",
          label: "Delete an app",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-update",
          label: "Update an app",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-config-datastore-show",
          label: "Get bitrise.yml of a specific app",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/branch-list",
          label: "List the branches with existing builds of an app's repository",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-change-connection-type",
          label: "Change the connection type of an app",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-change-github-app-connection-configuration",
          label: "Change Github app connection configuration of an app",
          className: "api-method put",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-change-linked-repositories",
          label: "Change the linked repositories of a Github app connection",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-remove-repository-authorization",
          label: "Remove repository authorization of an app",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-roles-query",
          label: "List group roles for an app",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-roles-update",
          label: "Replace group roles for an app",
          className: "api-method put",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-remove-service-credential-user",
          label: "Remove service credential user of an app",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-notifications",
          label: "Update the app's notification settings",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-list-by-organization",
          label: "Get list of the apps for an organization",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-list-by-user",
          label: "Get list of the apps for a user",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "app-setup",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-create",
          label: "Add a new app",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-config-create",
          label: "Upload a new bitrise.yml for your application",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-setup-bitrise-yml-config-get",
          label: "Getting the location of the application's bitrise.yaml",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-setup-bitrise-yml-config-update",
          label: "Changing the location of the application's bitrise.yaml",
          className: "api-method put",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-finish",
          label: "Save the application at the end of the app registration process",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/ssh-key-create",
          label: "Add an SSH-key to a specific app",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-webhook-create",
          label: "Register an incoming webhook for a specific application",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "android-keystore-file",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/android-keystore-file-list",
          label: "Get a list of the android keystore files",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/android-keystore-file-create",
          label: "Create an Android keystore file",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/android-keystore-file-show",
          label: "Get a specific Android Keystore file",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/android-keystore-file-delete",
          label: "Delete an android keystore file",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/android-keystore-file-confirm",
          label: "Confirm an android keystore file upload",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "builds",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/archived-builds-list",
          label: "List 1000 archived builds of an app",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/build-workflow-list",
          label: "List the workflows of an app",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/build-list",
          label: "List all builds of an app",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/build-trigger",
          label: "Trigger a new build/pipeline",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/build-show",
          label: "Get a build of a given app",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/build-abort",
          label: "Abort a specific build",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/build-bitrise-yml-show",
          label: "Get the bitrise.yml of a build",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/build-log",
          label: "Get the build log of a build",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/build-list-all",
          label: "List all builds",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/build-ai-summary",
          label: "Get AI-generated summary of a failed build",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "build-certificate",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/build-certificate-list",
          label: "Get a list of the build certificates",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/build-certificate-create",
          label: "Create a build certificate",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/build-certificate-show",
          label: "Get a specific build certificate",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/build-certificate-delete",
          label: "Delete a build certificate",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/build-certificate-update",
          label: "Update a build certificate",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/build-certificate-confirm",
          label: "Confirm a build certificate upload",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "build-request",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/build-request-list",
          label: "List the open build requests for an app",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/build-request-update",
          label: "Update a build request",
          className: "api-method patch",
        },
      ],
    },
    {
      type: "category",
      label: "build-artifact",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/artifact-list",
          label: "Get a list of all build artifacts",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/artifact-show",
          label: "Get a specific build artifact",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/artifact-delete",
          label: "Delete a build artifact",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/artifact-update",
          label: "Update a build artifact",
          className: "api-method patch",
        },
      ],
    },
    {
      type: "category",
      label: "key-value-cache",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/cache-list",
          label: "List the key-value cache items belonging to an app",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/cache-item-delete-all",
          label: "Delete all key-value cache items belonging to an app",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/cache-item-delete",
          label: "Delete a key-value cache item",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/cache-item-download",
          label: "Get the download URL of a key-value cache item",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "generic-project-file",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/generic-project-file-list",
          label: "Get a list of the generic project files",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/generic-project-files-create",
          label: "Create a generic project file",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/generic-project-file-show",
          label: "Get a specific generic project file",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/generic-project-file-delete",
          label: "Delete a generic project file",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/generic-project-file-update",
          label: "Update a generic project file",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/generic-project-file-confirm",
          label: "Confirm a generic project file upload",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "outgoing-webhook",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/outgoing-webhook-list",
          label: "List the outgoing webhooks of an app",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/outgoing-webhook-create",
          label: "Create an outgoing webhook for an app",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/outgoing-webhook-update",
          label: "Update an outgoing webhook of an app",
          className: "api-method put",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/outgoing-webhook-delete",
          label: "Delete an outgoing webhook of an app",
          className: "api-method delete",
        },
      ],
    },
    {
      type: "category",
      label: "webhook-delivery-item",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/webhook-delivery-item-list",
          label: "List the webhook delivery items of an app",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/webhook-delivery-item-show",
          label: "Get a specific delivery item of a webhook",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/webhook-delivery-item-redeliver",
          label: "Re-deliver the webhook delivery items of an app",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "pipelines",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/pipeline-list",
          label: "List all pipelines and standalone builds of an app",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/pipeline-show",
          label: "Get a pipeline of a given app",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/pipeline-abort",
          label: "Abort a pipeline",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/pipeline-rebuild",
          label: "Rebuild a pipeline",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/pipeline-list-all",
          label: "List all pipelines/standalone builds",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "provisioning-profile",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/provisioning-profile-list",
          label: "Get a list of the provisioning profiles",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/provisioning-profile-create",
          label: "Create a provisioning profile",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/provisioning-profile-show",
          label: "Get a specific provisioning profile",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/provisioning-profile-delete",
          label: "Delete a provisioning profile",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/provisioning-profile-update",
          label: "Update a provisioning profile",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/provisioning-profile-confirm",
          label: "Confirm a provisioning profile upload",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "secrets",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/secret-list",
          label: "List the application secrets (with no values)",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-secret-create",
          label: "Create a new app secret",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-secrets-show",
          label: "Get a single app secret by name",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/secret-upsert",
          label: "Upsert an application secret",
          className: "menu__list-item--deprecated api-method put",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/secret-delete",
          label: "Delete an application secret",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/app-secret-update",
          label: "Update an existing app secret",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/secret-value-get",
          label: "Get the value of an (unprotected) application secrets",
          className: "menu__list-item--deprecated api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/organization-secrets-list",
          label: "Get the secrets of an organization",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/organization-secret-create",
          label: "Create a new organization secret",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/organization-secrets-show",
          label: "Get a single secret by name",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/organization-secret-delete",
          label: "Delete a secret by name",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/organization-secret-update",
          label: "Update an existing secret",
          className: "api-method patch",
        },
      ],
    },
    {
      type: "category",
      label: "test-devices",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/test-device-list",
          label: "List the test devices for an app",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "configuration",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/available-stacks-list",
          label: "List available stacks",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/organization-available-stacks-list",
          label: "List available stacks for an organization",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/search-steps",
          label: "Find steps",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/step-inputs",
          label: "List step inputs",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/validate-bitrise-yml",
          label: "Validate a Bitrise YAML file",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "groups",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/group-member-add",
          label: "Add a member to a group",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "user",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/user-profile",
          label: "Get your profile info",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/user-machine-type-update",
          label: "Migrate machine types",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/user-show",
          label: "Get a specific user",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "activity",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/activity-list",
          label: "Get list of Bitrise activity events",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "organizations",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/org-list",
          label: "List the organizations that the user is part of",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/org-show",
          label: "Get a specified organization",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/organization-machine-type-update",
          label: "Migrate machine types",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/organization-group-list",
          label: "List organizations groups",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/organization-group-add",
          label: "Add a group to the organization",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/member-list",
          label: "List the members of the organization",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/member-add",
          label: "Add a member to the organization",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "apple-api-credentials",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/organizations-list-apple-api-credentials",
          label: "List Apple API credentials for a specific organization",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/organizations-create-apple-api-credentials",
          label: "Create Apple API Credential",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/organizations-delete-apple-api-credentials",
          label: "Delete Apple API Credential",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/apple-api-credential-list",
          label: "List Apple API credentials for a specific user",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "google-service-credentials",
      items: [
        {
          type: "doc",
          id: "bitrise-api/api-reference/organizations-list-google-service-credentials",
          label: "List Google Service credentials for a specific organization",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/organizations-create-google-service-credentials",
          label: "Create Google Service Credential",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-api/api-reference/organizations-delete-google-service-credentials",
          label: "Delete Google Service Credential",
          className: "api-method delete",
        },
      ],
    },
  ],
};

export default sidebar.apisidebar;
