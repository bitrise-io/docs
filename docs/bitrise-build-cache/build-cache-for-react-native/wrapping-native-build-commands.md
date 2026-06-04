---
title: "Wrapping native build commands"
sidebar_position: 4
---

After activation, prefix every command that triggers a *native* build with `bitrise-build-cache react-native run`. The wrapper:

- Ensures the `ccache` storage helper is running for the duration of the build.
- Tracks cache hit rates and reports build analytics back to Bitrise.
- Forwards arguments, `stdin`, `stdout`, `stderr`, and the exit code of your command unchanged.

**Before:**

```bash
npx react-native run-android
```

**After:**

```
bitrise-build-cache react-native run npx react-native run-android
```

This works with any package manager or build tool:

```
# yarn
bitrise-build-cache react-native run yarn build:android

# npm
bitrise-build-cache react-native run npm run build:ios

# expo
bitrise-build-cache react-native run expo build:ios

# pnpm
bitrise-build-cache react-native run pnpm run build:android

# fastlane
bitrise-build-cache react-native run fastlane beta

# Direct Gradle invocation
bitrise-build-cache react-native run ./gradlew assembleRelease
```

You only need to wrap commands that ultimately invoke Gradle or Xcode. Plain JS commands (`yarn install`, `yarn test`, etc.) do not need to be wrapped.
