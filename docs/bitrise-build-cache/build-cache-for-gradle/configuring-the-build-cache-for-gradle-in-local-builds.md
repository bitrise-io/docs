---
title: "Configuring the build cache for Gradle in local builds"
description: "Set up the Bitrise Build Cache for local Gradle builds so your machine reads the same cache your CI builds populate."
sidebar_position: 3
slug: /bitrise-build-cache/build-cache-for-gradle/configuring-the-build-cache-for-gradle-in-local-builds
sidebar_label: Configuring the Build Cache for Gradle in local environments
---

You can use the Bitrise Build Cache for local Gradle builds too. Your local builds then read from the same cache as your CI builds, so a task your CI already compiled doesn't have to be compiled again on your machine.

The Bitrise Build Cache CLI sets this up for you. It writes a Gradle init script to `~/.gradle/init.d/`, so your project files stay untouched.

## Before you start

Ensure you have:
- A working Gradle project on your machine (macOS or Linux).
- A Bitrise workspace with the Build Cache enabled. Check it on the [Build Cache page](https://app.bitrise.io/build-cache/).

:::note[Android projects with native code]

If your project builds C/C++ code (NDK, JNI, or native modules), set up `ccache` alongside Gradle. The Gradle plugin caches Java and Kotlin task outputs, but native compiles bypass it and go through `ccache` instead. Install it with `brew install ccache`, then select both **Gradle** and **ccache (C/C++)** in the wizard.

:::

## Installing the CLI

Install the CLI with Homebrew (**recommended**):

```bash
brew install bitrise-io/bitrise-build-cache/bitrise-build-cache
```

Or, without Homebrew:

```bash
curl --retry 5 -sSfL \
  'https://raw.githubusercontent.com/bitrise-io/bitrise-build-cache-cli/main/install/installer.sh' \
  | sh -s -- -b ~/.local/bin
```

Make sure the install location is on your `PATH`, then check the install:

```bash
bitrise-build-cache --version
```

## Activating the cache

Run the interactive wizard:

```bash
bitrise-build-cache activate --interactive
```

The wizard asks for the following:

- **Sign in to Bitrise**: opens your browser for authentication on the first run. The CLI stores the credentials in the OS keychain and refreshes them automatically, so later runs skip this step. On a machine without a usable keychain, the CLI falls back to storing them in a config file.
- **Select a workspace**: pick the workspace whose Build Cache you want to use. The CLI selects it automatically if you only have access to one.
- **Which build tools should I set up**: select **Gradle**, plus **ccache (C/C++)** if your project builds native code. Use space to toggle an option and enter to confirm.
- **Display name for this machine's local invocations**: the name your local builds show up under in the Build Cache dashboard, for example `local-<yourhandle>`.
- **Enable cache push**: select **No, pull only**. See [Local builds only read from the cache](#local-builds-only-read-from-the-cache).
- **Keep the cache proxies running in the background**: select **Yes, install + start** if you set up `ccache`. This registers the helper processes with the OS so they survive shell restarts.

:::note[Environment Variables take precedence]

If `BITRISE_BUILD_CACHE_AUTH_TOKEN` and `BITRISE_BUILD_CACHE_WORKSPACE_ID` are already set in your shell, the CLI uses those instead of the stored credentials. Unset them if you want the sign-in to apply.

:::

## Verifying the setup

Run the CLI's health check:

```bash
bitrise-build-cache doctor
```

It reports the status of every part of the local setup — credentials, backend connectivity, helper processes, and log directories — and ends with an overall verdict:

```bash
Bitrise Build Cache - doctor
CLI version: 3.x.y

Healthy:
  ✓ auth                   OAuth login (keychain) (workspace <id>), token valid until <iso-timestamp>
  ✓ keychain-smoke         Set/Get/Delete round-trip OK
  ✓ auth-backend           latency <ms>, source=keychain, workspace=<id>
  ✓ ccache-binary          found at /opt/homebrew/bin/ccache
  ✓ ccache-helper          running (~/.local/state/ccache/ccache.sock)
  ✓ log-dirs               all log dirs present + writable

Overall: ok
```

To let the CLI repair the issues it can fix on its own, run `bitrise-build-cache doctor --fix --interactive`.

## Running a build

Clean the project's local build outputs first, so the build has to fetch from the remote cache. Pass `--no-daemon` as well: a Gradle daemon started before the activation doesn't pick up the new configuration.

```bash
cd path/to/your/gradle/project
./gradlew clean --no-daemon
./gradlew :app:assembleDebug
```

A build that hits a warm cache ends like this:

```bash
> Task :app:compileDebugKotlin FROM-CACHE
> Task :feature:one:compileDebugKotlin FROM-CACHE

BUILD SUCCESSFUL in 18s
149 actionable tasks: 71 executed, 78 from cache

[Bitrise Analytics] 155 tasks uploaded. Check invocation at
    https://app.bitrise.io/build-cache/invocations/gradle/<uuid>
```

## Checking that it worked

| Signal | Where to find it | What success looks like |
|---|---|---|
| `Task :module:name FROM-CACHE` | Gradle build output, per task | The task line ends with `FROM-CACHE` |
| `N actionable tasks: X executed, Y from cache` | Gradle build summary | A non-zero `from cache` count |
| Invocation link | Printed at the end of the build | Opens the per-task metrics for the build |
| Dashboard | [Build Cache page](https://app.bitrise.io/build-cache/) | A row appears under your display name |
| Init script | `~/.gradle/init.d/bitrise-build-cache.init.gradle.kts` | The file exists and contains `buildCache {` |

## Local builds only read from the cache

The setup above activates the Build Cache in pull-only mode: your local builds read from the shared cache but never write to it. This is the recommended mode for local development.

Build tools recommend writing cache entries only from an environment where the source files don't change during the build. On a local machine you might keep editing files while a build is running, which can produce cache entries that don't match their inputs — and those entries would then be served to your teammates and to CI. Pull-only removes that risk: a broken local build can't affect anyone else.

The usual pattern is to have CI populate the cache, because CI builds from a clean, fixed checkout, and to let local machines pull from it.

## Pushing to the cache from local builds

Pull-only assumes that something else fills the cache, which is normally CI. If nothing does, your local builds have nothing to read: the summary line says `0 from cache`, and it keeps saying that.

If your team doesn't run the Build Cache on CI, turn pushing on for your local builds and leave it on. Your machine then populates the cache as you work, for you and for your teammates.

Re-run `bitrise-build-cache activate --interactive` and answer **Yes, push too** at the cache push prompt when you run the wizard, or run the non-interactive activate command:

```bash
bitrise-build-cache activate gradle --cache --cache-push
```

If a build doesn't behave as expected, re-run the activation with debug logging:

```bash
bitrise-build-cache activate gradle --cache --cache-push --debug
```

The trade-off is the one described above: an entry written from a build whose source files changed while it was running can be wrong, and your teammates read the same entry. Avoid editing files during a build you push from.

Setting up the Build Cache on CI is the more robust option, because CI builds from a clean, fixed checkout. Once it runs there, switch your machine back to pull-only.

## Troubleshooting

Start with the CLI's health check. It inspects every part of the local setup and repairs the issues it can fix on its own:

```bash
bitrise-build-cache doctor --fix --interactive
```

If that doesn't sort it out:

- The wizard reports that it needs a terminal: run `TERM=dumb bitrise-build-cache activate --interactive` for line-based mode.
- `doctor` reports a problem it can't fix: re-run it with `--debug` for the full context.
- Your build ignores the new configuration: stop any running Gradle daemons with `./gradlew --stop`, or pass `--no-daemon`.
- You want to start over: it's safe to re-run the wizard. It re-reads the current state and applies the same activation again.
