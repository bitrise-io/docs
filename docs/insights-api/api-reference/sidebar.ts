import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebar: SidebarsConfig = {
  apisidebar: [
    {
      type: "doc",
      id: "insights-api/api-reference/bitrise-insights-api",
    },
    {
      type: "category",
      label: "builds",
      items: [
        {
          type: "doc",
          id: "insights-api/api-reference/insights-builds-series",
          label: "Get a build metrics time series for a project",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "insights-api/api-reference/insights-builds-totals",
          label: "Get build aggregates for a project",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "tests",
      items: [
        {
          type: "doc",
          id: "insights-api/api-reference/insights-tests-flaky",
          label: "List the flaky test cases of a project",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "insights-api/api-reference/insights-tests-series",
          label: "Get a test metrics time series for a project",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "insights-api/api-reference/insights-tests-totals",
          label: "Get test aggregates for a project",
          className: "api-method get",
        },
      ],
    },
  ],
};

export default sidebar.apisidebar;
