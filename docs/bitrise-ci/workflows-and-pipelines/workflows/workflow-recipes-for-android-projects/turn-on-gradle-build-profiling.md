---
title: "Turn on Gradle build profiling"
sidebar_position: 11
---

## Description

Generate and store a performance report of every Gradle build to spot build speed issues or compare different builds.

## Instructions

No matter what Android or Gradle Step you use in your Bitrise Workflow, there is an option to define additional command line arguments for Gradle. Add `--profile` to the relevant input variable to generate a performance report of the Gradle tasks. In the example below, we are adding the argument to the **[Android Unit Test](https://www.bitrise.io/integrations/steps/android-unit-test)** Step.

1. Add the [**Android Unit Test**](https://www.bitrise.io/integrations/steps/android-unit-test) Step to your Workflow and set the necessary input variables:

   - **Project location**: $PROJECT_LOCATION.
   - **Module**: $MODULE.
   - **Variant**: $VARIANT.
   - **Arguments**: `--profile2`.
1. Add a **[Script](https://www.bitrise.io/integrations/steps/script)** Step to the end of the Workflow to compress the report files and copy the ZIP file to the deploy directory:

   ```bash
   #!/usr/bin/env bash
   # fail if any commands fails
   set -e
   # debug log
   set -x

   zip -r $BITRISE_DEPLOY_DIR/gradle-profile.zip $PROJECT_LOCATION/build/reports/profile
   ```

   Gradle creates the HTML report in `build/reports/profile/`, so we need to take all files in that folder (HTML, CSS and JS files), compress them, and move the ZIP archive to $BITRISE_DEPLOY_DIR. Files in this folder can be accessed on the build page’s **Artifacts** tab.
1. Trigger a manual build of your app.
1. Download and unarchive the `gradle-profile.zip` file, then open the HTML report in your browser.
1. Go to the **Artifacts** tab and check the various aspects of the build in the report:

   - The **Summary** tab shows time spent on things other than task execution.
   - The **Task execution** tab lists all tasks sorted by execution time.
   - Cached tasks are marked as **UP-TO-DATE**. This helps to fine-tune the [Bitrise Cache Steps](/en/bitrise-ci/dependencies-and-caching/key-based-caching/dedicated-caching-steps-for-dependency-managers) by comparing the reports of multiple builds.

   For Gradle optimization ideas, [check out this article by Google](https://developer.android.com/studio/build/profile-your-build#using-the-gradle---profile-option).

   If you only want to display task execution times only in the build log, you can use the [build-time-tracker](https://github.com/asarkar/build-time-tracker) plugin.

## bitrise.yml

```
- android-unit-test@1:
    inputs:
    - project_location: $PROJECT_LOCATION
    - module: $MODULE
    - arguments: "--profile"
    - variant: $VARIANT
- script@1:
    title: Collect Gradle profile report
    inputs:
    - content: |-
        #!/usr/bin/env bash
        # fail if any commands fails
        set -e
        # debug log
        set -x

        zip -r $BITRISE_DEPLOY_DIR/gradle-profile.zip $PROJECT_LOCATION/build/reports/profile
- deploy-to-bitrise-io@1: {}
```
