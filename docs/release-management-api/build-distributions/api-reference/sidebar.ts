import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebar: SidebarsConfig = {
  apisidebar: [
    {
      type: "doc",
      id: "release-management-api/build-distributions/api-reference/release-management-api-build-distributions",
    },
    {
      type: "category",
      label: "Build Distributions",
      items: [
        {
          type: "doc",
          id: "release-management-api/build-distributions/api-reference/list-build-distributions",
          label: "Get the list of the build distribution versions",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management-api/build-distributions/api-reference/list-test-builds",
          label: "Get a list of test builds",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Tester Groups",
      items: [
        {
          type: "doc",
          id: "release-management-api/build-distributions/api-reference/list-tester-groups",
          label: "Get a list of tester groups",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management-api/build-distributions/api-reference/create-tester-group",
          label: "Create a tester group",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "release-management-api/build-distributions/api-reference/delete-tester-group",
          label: "Delete a tester group",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "release-management-api/build-distributions/api-reference/get-tester-group",
          label: "Get Tester group details",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management-api/build-distributions/api-reference/update-tester-group",
          label: "Update tester group",
          className: "api-method put",
        },
        {
          type: "doc",
          id: "release-management-api/build-distributions/api-reference/add-testers-to-tester-group",
          label: "Add testers to a tester group",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "release-management-api/build-distributions/api-reference/notify-tester-group",
          label: "Notify the tester group",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "release-management-api/build-distributions/api-reference/list-potential-testers",
          label: "Get a list of potential tester candidates to the tester groups",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Testers",
      items: [
        {
          type: "doc",
          id: "release-management-api/build-distributions/api-reference/list-testers",
          label: "Get a list of testers",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management-api/build-distributions/api-reference/delete-tester",
          label: "Delete a tester",
          className: "api-method delete",
        },
      ],
    },
  ],
};

export default sidebar.apisidebar;
