---
title: "Troubleshooting the cloud controller"
sidebar_position: 6
slug: /bitrise-platform/infrastructure/bitrise-on-aws--cloud-controller/troubleshooting-the-cloud-controller
---

We've listed some of the potential issues you might run into when attempting to use a cloud controller to run Bitrise builds on AWS. If you're experiencing problems, check this page for your issue.

Can't see the Bitrise on AWS screen

Make sure you’re looking at the correct place on the **Workspace settings** page.

If the page is not there, contact [Bitrise](https://bitrise.io/). You might need additional access rights.

I see the Bitrise on AWS screen, but I cannot create a new controller

Only Workspace Owners can create a new controller. Please make sure you have the correct access rights.

The CloudFormation fails to create the stack when setting up the instance on AWS

Please open a [support ticket](https://bitrise.io/)!

The controller instance cannot connect to Bitrise

1. Confirm that your configuration is correct:

   - Check the CloudWatch logs for any errors. If the controller starts working but fails to execute anything, you will find the related logs there.
   - Under AWS Secrets Manager & Secrets, validate that both the workspace ID and the controller token are provided correctly.

   If any of the above is not configured correctly, destroy the CloudFormation stack and recreate it with the correct settings.
1. If the instance started but cannot connect to Bitrise:

   - Check the System Logs of the instance:

     If you see an `Error response from daemon: Get "https://public.ecr.aws/v2/": context deadline exceeded` message, you probably don’t have internet access on your instance. Double-check your route table configuration and make sure the configured subnets are able to access the internet.
   - Ensure that egress communication to the Bitrise URLs works. You can validate it in the following way:

     SSH into the created instance. In the terminal, use `telnet`, `curl`, or `wget` to access `cloud-controller-aws-internal.services.bitrise.io:443`.

     If the request runs to timeout, collect the evidence and notify our support.

     If you get 404, the egress communication is good.
1. If none of the above works, get in touch with Bitrise.

The controller instance is randomly recreating

This could be part of the normal workflow. A built-in functionality keeps the registered controllers in a fresh version to ensure the controller is compatible with the constantly evolving Bitrise.

The controller also has a built-in health check functionality, which ensures that the instance is always working and working correctly. As part of that, to solve intermittent issues, the instances can occasionally restart. This is not going to prevent the controller from working correctly.

If the controller is still restarting frequently or the user suspects issues with the controller’s behavior, please get in touch with Bitrise.

I forgot the controller’s Secret before creating the controller in AWS

You can read the token from the AWS Secrets.

I cannot delete the controller from Bitrise

You can delete the controller by clicking the **Remove** button next to the controller on the **Workspace settings** page. Only Owners of the Workspace can delete a controller.

:::important[Removing the controller from AWS]

Deleting the controller from Bitrise does not remove the controller from AWS. That needs to happen separately. After deleting a connected controller from Bitrise, the controller running in AWS will no longer be able to operate.

:::

I cannot create a new machine pool

Only Workspace Owners can create machine pools. Please make sure you have the correct access rights.

I created a pool, but nothing happens

Make sure the controller is in a **Connected** state:

![controller-ready.png](/img/_paligo/uuid-85d4125e-c0ef-ea64-d916-d04725b00581.png)

If the Controller is in a Connected state, please check the CloudWatch logs for any errors. The CloudWatch logs could hold information about the misconfigured settings. For example:

- Image availability and access.
- Disk size requirement.
- Security group and subnet configuration issues.

I have configured the pool and see a machine, but its status has been Starting for over 3 minutes now

When a new MacOS instance starts in AWS, it could take 5-10 minutes to start the underlying infrastructure.

Open the instance details and check the **Created at** field under **Machine details**:

If you see that the host details are filled after minutes, but the instance details are empty, that probably means the pool configuration was incorrect. That could be confirmed under AWS CloudWatch logs. Possible issues include a non-existent SSH key, an incorrect subnet or security group, and an unavailable AMI ID configured. Based on the findings, update the machine pool configuration.

![pool-detail.png](/img/_paligo/uuid-a30a61ec-5dea-3792-44ea-3e6d9c96b19d.png)

The instance has started on the AWS infrastructure if the machine details are filled in. If you see that the machine was created more than 8-9 minutes ago and the machine’s status is still **Starting**, start investigating:

- Ensure all the configurations and the AWS resources are correctly provided.
- Ensure the created instance can reach out to Bitrise: log in to the instance via the provided SSH key and ping exec.bitrise.io.

I have created a pool, and machines are in the Running state, but I can't start builds on them

Make sure that your builds are targeting the correct pool. In the Workflow Editor, every pool is selectable; make sure the correct `agent-pool-***` is selected for the builds.

I have manually added a security group to one of the Bitrise-managed instances, but in a few seconds, the instance status becomes shutting-down

The controller is responsible for achieving a state of machines configured on the Bitrise page. If any instances deviate from the required configuration, the controller identifies that and restarts the misconfigured resource.

Please reconfigure the pool if you want to change such a configuration.

I would like to reconfigure the pool to have fewer/more instances, but I don’t see the Edit button

Only Workspace Owners can edit the pool configuration. Please make sure you have the correct access rights.

I requested fewer machines, but in AWS, I still see Bitrise-managed dedicated hosts in pending/available status

When a dedicated host is reserved, it cannot be released until 24 hours. The controller tries to free up the oldest dedicated hosts, but the dedicated host cannot be released if the 24-hour window has not passed.

The controller is going to make sure to release the unneeded resources.

I requested fewer machines 5 minutes ago, but there are still as many machines as I had before in the Running state

Make sure that the controller is still in the **Connected** state.

If the controller is connected, the system might prevent machine termination if builds are still running on the machines. If all the machines are running builds, the system marks the machine with the oldest dedicated host to be terminated. The machine termination will also start as soon as the running build finishes.

The above logic does not target the build expected to finish first. Instead, it targets the dedicated host that could be released soonest to save you extra costs.

I cannot delete the machine pool I have created

Only Workspace Owners can delete a machine pool. Workspace Owners can also reconfigure the pools if any of the settings are incorrect, like the desired number of replicas.

I need to access Bitrise Agent logs

To obtain Bitrise Agent logs, configure CloudWatch Bitrise Agent logging. This is an optional feature but we highly recommend using it for better troubleshooting capabilities.
