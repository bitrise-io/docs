---
title: "Pipeline builds"
description: "Bitrise Pipeline builds can be triggered the same way as Workflow builds, they can send status reports, and all their artifacts are available on the Artifacts page. You can use Pipeline builds to upload installable artifact's to Release Management."
sidebar_position: 3
slug: /bitrise-ci/workflows-and-pipelines/build-pipelines/pipeline-builds
---

You can run Pipeline builds the same way you would run builds of standalone Workflows:

- [You can start Pipeline builds manually](/en/bitrise-ci/run-and-analyze-builds/starting-builds/starting-builds-manually).
- [Schedule Pipeline builds](/en/bitrise-ci/run-and-analyze-builds/starting-builds/scheduling-builds).
- [Trigger Pipeline builds automatically](/en/bitrise-ci/run-and-analyze-builds/build-triggers/configuring-build-triggers). You can configure Pipeline triggers in the Workflow Editor or in YAML: [YAML syntax for build triggers](/en/bitrise-ci/run-and-analyze-builds/build-triggers/yaml-syntax-for-build-triggers).

Pipeline builds are capable of sending build status reports: a Pipeline build will send a status report of the Pipeline itself and of any Steps that export test results: [Reporting the build status to your Git hosting provider](/en/bitrise-ci/configure-builds/configuring-build-settings/reporting-the-build-status-to-your-git-hosting-provider).

All artifacts of a Pipeline build are available on the **Artifacts** page: [Build artifacts online](/en/bitrise-ci/run-and-analyze-builds/managing-build-files/build-artifacts-online).

You can use Pipeline builds to upload installable artifacts to Release Management, in order to distribute your mobile app to testers and release the app in an online store. All you need is a Workflow that generates an installable APK, AAB or IPA file: [see topic](urn:resource:component:92027).
