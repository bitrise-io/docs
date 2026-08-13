import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebar: SidebarsConfig = {
  apisidebar: [
    {
      type: "doc",
      id: "release-management-api/store-releases/api-reference/release-management-api-app-versions",
    },
    {
      type: "category",
      label: "App Versions",
      items: [
        {
          type: "doc",
          id: "release-management-api/store-releases/api-reference/list-releases",
          label: "Get a list of app versions",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management-api/store-releases/api-reference/create-release",
          label: "Create an app version",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "release-management-api/store-releases/api-reference/delete-release",
          label: "Delete an app version",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "release-management-api/store-releases/api-reference/get-release",
          label: "Get an app version",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management-api/store-releases/api-reference/update-release",
          label: "Update an app version",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "release-management-api/store-releases/api-reference/list-outgoing-webhooks",
          label: "Get a list of outgoing webhooks",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management-api/store-releases/api-reference/create-outgoing-webhook",
          label: "Create an outgoing webhook",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "App Versions - Release Candidate",
      items: [
        {
          type: "doc",
          id: "release-management-api/store-releases/api-reference/get-release-candidate",
          label: "Get data on the release candidate",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management-api/store-releases/api-reference/submit-release-candidate-for-beta-review",
          label: "Submit release candidate for beta review",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "release-management-api/store-releases/api-reference/upload-release-candidate",
          label: "Upload a release candidate",
          className: "api-method put",
        },
        {
          type: "doc",
          id: "release-management-api/store-releases/api-reference/get-release-candidate-upload-status",
          label: "Get the upload status of a release candidate",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "App Versions - Approvals",
      items: [
        {
          type: "doc",
          id: "release-management-api/store-releases/api-reference/list-approval-tasks",
          label: "Get a list of approval tasks",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management-api/store-releases/api-reference/create-approval-task",
          label: "Create an approval task",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "release-management-api/store-releases/api-reference/delete-approval-task",
          label: "Delete an approval task",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "release-management-api/store-releases/api-reference/get-approval-task",
          label: "Get an approval task",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management-api/store-releases/api-reference/update-approval-task",
          label: "Update an approval task",
          className: "api-method patch",
        },
      ],
    },
    {
      type: "category",
      label: "App Versions - Store Beta Distribution",
      items: [
        {
          type: "doc",
          id: "release-management-api/store-releases/api-reference/list-testing-groups",
          label: "Get a list of testing groups/tracks",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management-api/store-releases/api-reference/finish-beta-distribution-on-testing-group",
          label: "Stop beta distribution on the testing group - IOS only",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "release-management-api/store-releases/api-reference/start-beta-distribution-on-testing-group",
          label: "Start beta distribution on the testing group/track",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "release-management-api/store-releases/api-reference/list-what-to-test-descriptions",
          label: "Get a list of 'What to test' descriptions - IOS only",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management-api/store-releases/api-reference/create-what-to-test-description",
          label: "Create the 'What to test' description - IOS only",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "release-management-api/store-releases/api-reference/remove-what-to-test-description",
          label: "Remove the 'What to test' description with the given locale - IOS only",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "release-management-api/store-releases/api-reference/update-what-to-test-description",
          label: "Update the selected 'What to test' description - IOS only",
          className: "api-method patch",
        },
      ],
    },
    {
      type: "category",
      label: "App Versions - Apple App Store review",
      items: [
        {
          type: "doc",
          id: "release-management-api/store-releases/api-reference/cancel-review",
          label: "Cancel App Store review",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "release-management-api/store-releases/api-reference/get-review-status",
          label: "Get App Store review status",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management-api/store-releases/api-reference/submit-release-candidate-for-review",
          label: "Submit release candidate for App Store review",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "App Versions - Apple App Store Release",
      items: [
        {
          type: "doc",
          id: "release-management-api/store-releases/api-reference/create-store-release-ios",
          label: "Release App Store app. - iOS only",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "release-management-api/store-releases/api-reference/complete-phased-release-ios",
          label: "Complete an in-progress Apple App Store phased release, releasing to 100% of users. - iOS only",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "release-management-api/store-releases/api-reference/continue-phased-release-ios",
          label: "Continue a previously paused Apple App Store phased release. - iOS only",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "release-management-api/store-releases/api-reference/pause-phased-release-ios",
          label: "Pause an Apple App Store phased release. - iOS only",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "release-management-api/store-releases/api-reference/get-release-settings",
          label: "Get the release settings for the app version",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management-api/store-releases/api-reference/update-release-settings",
          label: "Update the release settings for the app version",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "release-management-api/store-releases/api-reference/get-release-status",
          label: "Get the release status of the app version",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "App Versions - Google Play Store Release",
      items: [
        {
          type: "doc",
          id: "release-management-api/store-releases/api-reference/update-localized-release-notes-android",
          label: "Update release notes for different locales - Android only",
          className: "api-method put",
        },
        {
          type: "doc",
          id: "release-management-api/store-releases/api-reference/create-store-release-android",
          label: "Release app for all users or for a fraction of users. - Android only",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "release-management-api/store-releases/api-reference/delete-staged-rollout-schedule-android",
          label: "Delete staged rollout schedule - Android only",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "release-management-api/store-releases/api-reference/get-staged-rollout-schedule-android",
          label: "Get staged rollout schedule - Android only",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "release-management-api/store-releases/api-reference/create-staged-rollout-schedule-android",
          label: "Create staged rollout schedule - Android only",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "release-management-api/store-releases/api-reference/pause-staged-rollout-schedule-android",
          label: "Pause staged rollout schedule - Android only",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "release-management-api/store-releases/api-reference/resume-staged-rollout-schedule-android",
          label: "Resume staged rollout schedule - Android only",
          className: "api-method post",
        },
      ],
    },
  ],
};

export default sidebar.apisidebar;
