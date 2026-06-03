---
title: "Configuring the Build Cache for React Native in non-Bitrise CI environments"
sidebar_position: 3
---

The Bitrise Build Cache CLI can be downloaded and run on any third-party CI provider (GitHub Actions, GitLab CI, CircleCI, Jenkins, etc.).

1. Create a [Personal Access Token](urn:resource:component:54560).
1. [Get your Workspace slug](/en/bitrise-ci/api/identifying-workspaces-and-apps-with-their-slugs).
1. Set two variables in your CI provider's secret/environment settings:

   - BITRISE_BUILD_CACHE_AUTH_TOKEN: your Personal Access Token.
   - BITRISE_BUILD_CACHE_WORKSPACE_ID: your Workspace slug.
1. Add the following script to your CI pipeline before any Step that triggers a native build.

   It must run in the same environment (same shell, same container) as the build commands it's meant to accelerate.

   ```
   #!/usr/bin/env bash
   set -euxo pipefail

   # Download the Bitrise Build Cache CLI.
   curl --retry 5 -sSfL \
     'https://raw.githubusercontent.com/bitrise-io/bitrise-build-cache-cli/main/install/installer.sh' \
     | sh -s -- -b /tmp/bin -d

   # Activate Build Cache for React Native (Gradle + Xcode + ccache for C++).
   /tmp/bin/bitrise-build-cache activate react-native
   ```

   By default this enables all three backends. To disable a backend, pass the matching flag:

   ```
   /tmp/bin/bitrise-build-cache activate react-native --gradle=true --xcode=true --cpp=false
   ```

   :::note

   If you have previously used the Bitrise Build Cache CLI for Gradle or Xcode only, make sure you are on **CLI v1.0.0 or later** to get React Native support.

   :::
1. After activation, the `bitrise-build-cache` binary is on PATH. Prefix any command that triggers a native build with `bitrise-build-cache react-native run`.

   :::note

   For more information about wrapping, see [Wrapping native build commands](/en/bitrise-build-cache/getting-started-with-the-build-cache/build-cache-for-react-native/wrapping-native-build-commands).

   :::

**Example configuration: GitHub Actions**

```
jobs:
  build-rn:
    runs-on: macos-latest
    env:
      BITRISE_BUILD_CACHE_AUTH_TOKEN: ${{ secrets.BITRISE_BUILD_CACHE_AUTH_TOKEN }}
      BITRISE_BUILD_CACHE_WORKSPACE_ID: ${{ secrets.BITRISE_BUILD_CACHE_WORKSPACE_ID }}
    steps:
      - uses: actions/checkout@v4
      - name: Activate Bitrise Build Cache for React Native
        run: |
          curl --retry 5 -sSfL \
            'https://raw.githubusercontent.com/bitrise-io/bitrise-build-cache-cli/main/install/installer.sh' \
            | sh -s -- -b /tmp/bin -d
          /tmp/bin/bitrise-build-cache activate react-native
      - name: Install JS dependencies
        run: yarn install
      - name: Build iOS
        run: /tmp/bin/bitrise-build-cache react-native run npx react-native run-ios --configuration=Release
      - name: Build Android
        run: /tmp/bin/bitrise-build-cache react-native run npx react-native run-android --mode=release
```

## Validating the setup

1. Run a build with the new configuration. The activation step should complete successfully.
1. Open the **Build details** page on Bitrise and check the **Build Cache** tab. You should see the wrapped commands listed with their cache stats.
1. The first build will report 0% cache hit rate: the cache is empty at this point. This is expected.
1. Run 1–3 additional builds to warm the cache. Subsequent builds should report a hit rate above 0%.
1. You can monitor cache performance per build and across builds on the [Build Cache list page](https://app.bitrise.io/build-cache/).
