---
title: "AI build fixer"
description: "If you have a failed build, the Bitrise AI build fixer corrects it right on the build’s details page without you having to switch to other tools and processes. The AI build fixer executes the suggested code changes and pushes a PR to your GitHub repository."
sidebar_position: 9
slug: /bitrise-ci/run-and-analyze-builds/build-data-and-troubleshooting/ai-build-fixer
---

If you have a failed build, the AI build fixer corrects it right on the build’s details page without you having to switch to other tools and processes. The AI build fixer executes the suggested code changes and pushes a PR to your GitHub repository. You can check the changes through a link to the repo. Based on your configured build triggers, Bitrise kicks off a new CI build to validate the AI changes. This means less fragmented work and quicker debugging.

:::note[AI build fixer credit consumption]

Note that every run attempt of the AI build fixer costs two AI credits.

:::

## Configuring the AI build fixer

To run the AI build fixer, you need to:

- Turn on [AI build summary.](/en/bitrise-platform/ai/ai-features-on-bitrise#ai-build-summary) The AI build fixer builds on the outputs and suggestions of the build summary.
- Enable the AI build fixer on the **Project settings** page.
- Add your own trusted domains to the build fixer configuration.

To do these:

1. From your workspace's **Dashboard**, click **Settings** on the left.
1. [Enable AI features](/en/bitrise-platform/ai/enabling-ai-features-on-bitrise).
1. On the **Project settings** page of your project, select **Bitrise AI**.
1. [Switch the toggle to enable AI build summary](/en/bitrise-ci/run-and-analyze-builds/build-data-and-troubleshooting/ai-build-summary).

   Without enabling it, you won't be able to use the AI build fixer since it relies on the findings of the AI Build summary.
1. Switch the toggle next to the **AI Build fixer**.

   ![2026-01-20-ai-build-fixer.png](/img/_paligo/uuid-311c03e1-c104-9bed-9744-f751497444a1.png)
1. To set the domains Bitrise AI build fixer can use, select your preferred option in the **Configure agent internet access** dialogue which appears after you enabled the toggle. Here are the two options to choose from:

   - **Use Bitrise trusted domains**: You can start with a preset list of domains and can add more if you wish. Here is the list of preset domains:

     ```
     alpinelinux.org
     anaconda.com
     apache.org
     apt.llvm.org
     archlinux.org
     azure.com
     bitbucket.org
     bower.io
     centos.org
     cocoapods.org
     continuum.io
     cpan.org
     crates.io
     debian.org
     docker.com
     docker.io
     dot.net
     dotnet.microsoft.com
     eclipse.org
     fedoraproject.org
     gcr.io
     ghcr.io
     github.com
     githubusercontent.com
     gitlab.com
     golang.org
     google.com
     goproxy.io
     gradle.org
     hashicorp.com
     haskell.org
     hex.pm
     java.com
     java.net
     jcenter.bintray.com
     json-schema.org
     json.schemastore.org
     k8s.io
     launchpad.net
     maven.org
     mcr.microsoft.com
     metacpan.org
     microsoft.com
     nodejs.org
     npmjs.com
     npmjs.org
     nuget.org
     oracle.com
     packagecloud.io
     packages.microsoft.com
     packagist.org
     pkg.go.dev
     ppa.launchpad.net
     pub.dev
     pypa.io
     pypi.org
     pypi.python.org
     pythonhosted.org
     quay.io
     ruby-lang.org
     rubyforge.org
     rubygems.org
     rubyonrails.org
     rustup.rsrvm.io
     sourceforge.netspring.io
     swift.orgubuntu.com
     visualstudio.com
     yarnpkg.com
     ```
   - **Add domains manually:** You can add the domains (for example, a hosted git provider or a dependency store) you want our build fixer to access. Note that you must add your git provider here, otherwise our Build agent won’t be able to access it.

     ![configure-agent-internet-access-bitrise.png](/img/_paligo/uuid-f2b44f50-8b8a-8c8e-48dd-c12a800692d0.png)

Once you enabled the Bitrise AI, the Bitrise Build fixer and set the domains, you can use the AI build fixer as well.

:::note[Your code is safe with us]

The Bitrise AI build fixer does not store any secrets or credentials while fixing your code or pushing the PR to your repo. For each fix attempt, it uses a one time only virtual machine which gets destroyed at the end of the run.

:::

## Running the AI build fixer

Now you are all set to run the AI build fixer on your project:

1. Go to your projects **Builds** page and select a failed build.
1. On the **Build log** tab go to **Bitrise AI** and click **Show details**.
1. Under**Failure reasons** click **Fix with AI**.

   ![fix-with-ai.png](/img/_paligo/uuid-e3205cde-6fb9-f316-9666-a22617129183.png)
1. Click **Continue with fix**if you want Bitrise AI to start a build fixer agent and push changes to your current branch.

   ![fix-build-with-ai.png](/img/_paligo/uuid-49707b16-e6a3-6f4e-ea0a-869f23923758.png)
1. Once the AI build fixer has run, it produces links to the**Triggered build**, **Pushed changes to GitHub**and to the **Agent logs** for you to check changes and approve. You are ready to merge the PR into your project's repository.

   ![produced_links-ai-build-fixer.png](/img/_paligo/uuid-623c579f-869c-110a-da28-346d2a574ac0.png)
