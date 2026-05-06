---
title: "Make caching efficient for pull request builds"
sidebar_position: 6
---

## Description

Bitrise caching is branch-based. You can optimize cache efficiency by keeping the cache up-to-date on a given branch.

If a branch doesn't have a cache entry yet, the repository's default branch is used as a fallback to pull a cache entry. If a pull request targets the main branch, this fallback mechanism is used to pull the default branch's cache (as the pull request branch doesn't have any cache entry yet). This means that caching can still be efficient if the pull request destination is the default branch and the cache is up-to-date on the default branch.

## Instructions

1. Make sure that any Workflow that runs frequently on the default branch contains the **[Bitrise.io Cache:Push](https://www.bitrise.io/integrations/steps/cache-push)** Step. This will keep the cache up to date with content from successful builds. We recommend one of two approaches:

   - Run the Workflow after every commit (for example, a merge) to the default branch, triggered by the push event on the default branch.
   - Run the Workflow as a scheduled nightly build every day. This warms up the cache by pushing content based on the latest state of the default branch.
1. (Optional) Set the **Compress cache** input variable to `true`. This can be useful if your cache folders are large and you are experiencing slow build times.
1. Make sure that the Workflow which runs the pull requests contains the [**Bitrise.io Cache:Pull**](https://www.bitrise.io/integrations/steps/cache-pull) Step.

   This pulls the cache from successful builds on the default branch. We don't recommend pushing content into the cache for pull request builds for security and efficiency reasons. Even if the Workflow contains the **[Bitrise.io Cache:Push](https://www.bitrise.io/integrations/steps/cache-push)** Step, it's skipped by default for pull request builds.

## bitrise.yml

Workflow running on the default branch:

```
# Add steps that produce the cached content (e.g. dependecies, builds)

- cache-push@2: {}
```

Pull request Workflow:

```
- cache-pull@2: {}

# Add steps that can utilise the restored cache content
```
