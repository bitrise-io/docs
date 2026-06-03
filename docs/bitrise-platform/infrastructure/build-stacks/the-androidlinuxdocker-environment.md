---
title: "The Android/Linux/Docker environment"
description: "Bitrise's Android stacks run on Linux-based virtual machines that are created from Docker images. You can find all the image files on GitHub."
sidebar_position: 7
slug: /bitrise-platform/infrastructure/build-stacks/the-android-linux-docker-environment
---

For our Linux-based stacks, we use standard Docker images, hosted on [Docker Hub](https://hub.docker.com/). You can find the available stacks, called **Ubuntu for Android & Docker**, in our [stack reports](https://stacks.bitrise.io/stack_reports/).

:::note[Pre-installed tools]

All stacks have a large number of pre-installed tools available: [Preinstalled tools on Bitrise stacks](/en/bitrise-platform/infrastructure/build-stacks/preinstalled-tools-on-bitrise-stacks)

:::

Every build runs in a new VM, not just in a new container. The VM is destroyed right after the build. This allows us to grant you full control over `Docker` and the whole environment.

When your build starts on a Docker-based stack, we volume mount the `/var/run/docker.sock` socket into your container (similar to calling `docker run -v /var/run/docker.sock:/var/run/docker.sock ...`. You can find a description about this access granting method [here](https://jpetazzo.github.io/2015/09/03/do-not-use-docker-in-docker-for-ci/)).

The `docker` binary has to be installed inside the base Docker image because docker started to migrate from a single-binary solution to dynamically loaded components, and simply sharing the `docker` binary is not sufficient anymore.

We install Docker in every one of our Docker images so that you don’t have to do anything if you use our image, or you base your own image on our Docker images.

This means that you have access to `docker` in your container, and can use other tools which use docker, like [docker-compose](https://docs.docker.com/compose). You can, for example, configure and run tests and other automations on website projects using `docker-compose`.

You can call `docker info`, `docker build`, `docker run`, `docker login`, `docker push` exactly how you would on your own machine.

:::note[Shared volumes]

If you want to run `docker` in your build and share volumes, please note that only those volumes can be shared that are shared with the base docker container (the one your build is running in). This is due to how `docker` handles volume sharing. Everything under `/bitrise` can be mounted as a volume, but no other path is guaranteed to work with `--volume` mapping.

It means that if you use the standard paths and you use relative paths to mount volumes, it’ll work as expected, as the default source code directory is located inside `/bitrise` (by default it’s `/bitrise/src` in our Docker images).

What WON’T WORK, however, is if you change the source code directory to be located outside of `/bitrise`, or you want to mount a folder with an absolute path outside of `/bitrise`.

:::
