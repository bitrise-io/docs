---
title: "React Native Cache FAQ"
sidebar_position: 5
---

## What exactly gets cached?

- **Android:** Gradle task outputs (compilation, resource processing, dex generation) via the remote build cache.
- **iOS:** Xcode compilation outputs (object files, module artifacts) via the LLVM CAS-backed cache.
- **C++ native modules:** Compiled native bridge code and third-party native modules via `ccache`, backed by Bitrise's remote storage.

## What does NOT get cached?

- **Metro JS bundling** — the JavaScript bundling step is not affected by this setup.
- **`node_modules`** — package installation (`yarn` / `npm` / `pnpm`) is not cached by this tool. Use Bitrise's standard caching steps if you want to cache `node_modules`.

## Do I need to wrap every command?

Only wrap commands that trigger *native builds*. You do not need to wrap:

- `yarn install` / `npm install` / `pnpm install`
- `yarn test` / `npm test` (JS-only tests)
- Any command that does not invoke Gradle or Xcode

Wrap commands like `npx react-native run-android`, `npx react-native run-ios`, `./gradlew assembleRelease`, `fastlane build`, or any script that ultimately calls `xcodebuild` or Gradle.

## Will this speed up my tests?

Build Cache reduces *compilation* time. If your test workflow includes a build step (for example `xcode-build-for-test`), that step will be faster. The actual test execution time is not affected.

## Can I use this alongside the standalone Gradle or Xcode Build Cache steps?

No — the **Build Cache for React Native** step configures caching for Gradle, Xcode, and C++ in one go. If you are already using a standalone **Build Cache for Gradle** or **Build Cache for Xcode** step, replace it with this step to avoid conflicting configurations.

## Can I selectively disable one of the backends?

Yes. The activation step exposes inputs for Gradle and Xcode (both default to `true`). On the CLI, pass `--gradle=false`, `--xcode=false`, or `--cpp=false` to `bitrise-build-cache activate react-native`. Disabling Gradle also disables the C++/`ccache` flow on the Android side; the C++ backend follows the `--cpp` flag.

## Can I still fine-tune ccache configuration?

Yes — the React Native activation only sets the following environment variables to point `ccache` at Bitrise's remote storage:

- CCACHE_BASEDIR
- CCACHE_NOHASHDIR
- CCACHE_REMOTE_ONLY
- CCACHE_REMOTE_STORAGE
- CMAKE_CXX_COMPILER_LAUNCHER
- CMAKE_C_COMPILER_LAUNCHER

Anything else — including your `ccache.conf` — is yours to customize. Note that the env vars above override the same parameters coming from config files.

## How do I troubleshoot issues?

- Enable verbose logging by setting the **Verbose logging** input on the Activate step (or pass `--debug` to the CLI). This logs additional details about cache configuration and the background storage helper.
- Confirm that the activation step ran in the *same environment* as the build commands (same container/shell on non-Bitrise CI).
- Confirm that native build commands are wrapped with `bitrise-build-cache react-native run`.
- Check the **Build Cache** tab on the build details page to see whether the wrapped invocations were registered.
- For iOS, confirm the stack uses **Xcode 26 or later**.

## I'm using an official Bitrise step to build my app. Do I still need the wrapper?

No. If you are using the latest versions of **Gradle Runner**, **Android Build**, or **Xcode Archive**, the wrapping is handled by the step itself — just make sure those steps are up to date. If you use a different official Bitrise step that triggers a native build, [let us know](https://github.com/bitrise-io/bitrise-build-cache-cli/issues) so we can add support.
