import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebar: SidebarsConfig = {
  apisidebar: [
    {
      type: "doc",
      id: "bitrise-rde-api/api-reference/bitrise-remote-dev-environments-api",
    },
    {
      type: "category",
      label: "User",
      items: [
        {
          type: "doc",
          id: "bitrise-rde-api/api-reference/codespaces-service-get-me",
          label: "Get current user",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Workspace",
      items: [
        {
          type: "doc",
          id: "bitrise-rde-api/api-reference/codespaces-service-get-workspace-info",
          label: "Get workspace info",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Saved inputs",
      items: [
        {
          type: "doc",
          id: "bitrise-rde-api/api-reference/codespaces-service-list-saved-inputs",
          label: "List saved inputs",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-rde-api/api-reference/codespaces-service-create-saved-input",
          label: "Create saved input",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-rde-api/api-reference/codespaces-service-delete-saved-input",
          label: "Delete saved input",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "bitrise-rde-api/api-reference/codespaces-service-get-saved-input",
          label: "Get saved input",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-rde-api/api-reference/codespaces-service-update-saved-input",
          label: "Update saved input",
          className: "api-method patch",
        },
      ],
    },
    {
      type: "category",
      label: "Templates",
      items: [
        {
          type: "doc",
          id: "bitrise-rde-api/api-reference/codespaces-service-list-templates",
          label: "List templates",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-rde-api/api-reference/codespaces-service-create-template",
          label: "Create template",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-rde-api/api-reference/codespaces-service-delete-template",
          label: "Delete template",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "bitrise-rde-api/api-reference/codespaces-service-get-template",
          label: "Get template",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-rde-api/api-reference/codespaces-service-update-template",
          label: "Update template",
          className: "api-method patch",
        },
      ],
    },
    {
      type: "category",
      label: "Sessions",
      items: [
        {
          type: "doc",
          id: "bitrise-rde-api/api-reference/codespaces-service-list-sessions",
          label: "List sessions",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-rde-api/api-reference/codespaces-service-create-session",
          label: "Create session",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-rde-api/api-reference/codespaces-service-delete-session",
          label: "Delete session",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "bitrise-rde-api/api-reference/codespaces-service-get-session",
          label: "Get session",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-rde-api/api-reference/codespaces-service-update-session",
          label: "Update session",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "bitrise-rde-api/api-reference/codespaces-service-list-session-notifications",
          label: "List session notifications",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-rde-api/api-reference/codespaces-service-open-remote-access",
          label: "Open remote access",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-rde-api/api-reference/codespaces-service-restore-session",
          label: "Restore session",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-rde-api/api-reference/codespaces-service-start-session",
          label: "Start session",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-rde-api/api-reference/codespaces-service-stop-session",
          label: "Stop session",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-rde-api/api-reference/codespaces-service-compare-session-template",
          label: "Compare session template",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-rde-api/api-reference/codespaces-service-terminate-session",
          label: "Terminate session",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-rde-api/api-reference/codespaces-service-delete-terminated-sessions",
          label: "Delete terminated sessions",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "Session interaction",
      items: [
        {
          type: "doc",
          id: "bitrise-rde-api/api-reference/codespaces-service-session-click",
          label: "Click",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-rde-api/api-reference/codespaces-service-session-complete-file-upload",
          label: "Complete file upload",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-rde-api/api-reference/codespaces-service-session-download",
          label: "Download files",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-rde-api/api-reference/codespaces-service-session-download-file",
          label: "Download files",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-rde-api/api-reference/codespaces-service-session-execute",
          label: "Execute command",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-rde-api/api-reference/codespaces-service-get-session-logs",
          label: "Stream session logs",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-rde-api/api-reference/codespaces-service-session-mouse-drag",
          label: "Drag mouse",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-rde-api/api-reference/codespaces-service-session-screenshot",
          label: "Take screenshot",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-rde-api/api-reference/codespaces-service-session-scroll",
          label: "Scroll",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-rde-api/api-reference/codespaces-service-session-start-file-upload",
          label: "Start file upload",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-rde-api/api-reference/codespaces-service-session-start-upload",
          label: "Start upload",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-rde-api/api-reference/codespaces-service-session-complete-upload",
          label: "Complete upload",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-rde-api/api-reference/codespaces-service-session-type",
          label: "Type text",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "Machine catalog",
      items: [
        {
          type: "doc",
          id: "bitrise-rde-api/api-reference/codespaces-service-list-images",
          label: "List images",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-rde-api/api-reference/codespaces-service-list-machine-types",
          label: "List machine types",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "bitrise-rde-api/api-reference/codespaces-service-resolve-clusters",
          label: "Resolve clusters",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "bitrise-rde-api/api-reference/codespaces-service-list-stacks",
          label: "List stacks",
          className: "api-method get",
        },
      ],
    },
  ],
};

export default sidebar.apisidebar;
