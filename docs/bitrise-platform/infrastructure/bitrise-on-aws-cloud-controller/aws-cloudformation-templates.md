---
title: "AWS CloudFormation templates"
description: "[AWS CloudFormation](https://aws.amazon.com/cloudformation/) simplifies the one-click provisioning and management of the Bitrise Cloud Controller on AWS. When the CloudFormation template is deployed into a customer VPC, it creates the Bitrise Cloud Controller and the accompanying infrastructure."
sidebar_position: 4
slug: /bitrise-platform/infrastructure/bitrise-on-aws--cloud-controller/aws-cloudformation-templates
---

[AWS CloudFormation](https://aws.amazon.com/cloudformation/) simplifies the one-click provisioning and management of the Bitrise Cloud Controller on AWS. When the CloudFormation template is deployed into a customer VPC, it creates the Bitrise Cloud Controller and the accompanying infrastructure.

![cloudformation.png](/img/_paligo/uuid-f52635e0-c0c6-f09a-042a-4d8e785fb35c.png)

Bitrise maintains CloudFormation templates for different use cases:

- **Deploy Cloud Controller to an existing VPC:** Choose this template if the user has an established AWS presence with already built-out networking.
- **Deploy Cloud Controller into a brand new VPC**: Choose this template if the user is new to AWS or doesn’t have an already built-out networking. This template creates a new VPC first (based on customer preferences) and then deploys the controller into it.
- **Deploy Airgapped Cloud Controller to an existing VPC**: Choose this template if the user has an established AWS presence with already built-out networking and would like to run the controller in a strictly [airgapped environment](/en/bitrise-platform/infrastructure/bitrise-on-aws--cloud-controller.html). This is not fully automated: some [manual configuration is needed](#section-idm234367326684698).
- **Deploy Airgapped Cloud Controller into a brand new VPC**: Choose this template if the user is new to AWS or doesn’t have an already built-out networking and would like to run the controller in a strictly [airgapped environment](/en/bitrise-platform/infrastructure/bitrise-on-aws--cloud-controller.html). This template creates a new VPC first with the correct airgapped configuration and then deploys the controller into it.

## Deploy CloudController to an existing VPC

Template parameters:

- **Stack Name** (required): Identifies the Bitrise Cloud Controller parent stack within the AWS Account.
- **Latest AMI ID**: This AMI ID is used as a base AMI to run the Cloud Controller on.
- **BitriseControllerToken** (required): The controller token the user receives when creating a controller on the Bitrise Website.
- **BitriseWorkspaceID** (required): The workspace ID belonging to the customer’s Bitrise account.
- **ControllerLogGroupClass** (required): The controller saves error logs to a CloudWatch log group within the customer AWS Account. The customer controls which [Log Group Class](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CloudWatch_Logs_Log_Classes.html) fits their budget the most. The default value should be suitable for most of the cases. Default: `INFREQUENT_ACCESS`.
- **ControllerLogRetentionInDays** (required): The number of days CloudWatch should retain the Controller error logs. Default: 7 (days).
- **ControllerSshKey** (required): Provides SSH access for the Cloud Controller instance.
- **SubnetIds** (required): At least two subnets within the same region but in different AZs. We recommend using private subnets, but public subnets work as well.
- **VpcId** (required): The VPC where the controller will be deployed.
- **VpcCidrBlock** (required): The CIDR block of the selected VPC.
- **CustomBashScript** (optional): Custom bash script to run on instance startup
- **UseHostNetwork (required)**: Use host network mode for Docker container (--net=host)

### Infrastructure provisioned by the template

- **Internal Application Load Balancer**: Servers have no traffic and only perform periodic health checks on the Cloud Controller instance. In all cases the Controller and the build machines will initiate network calls toward the Bitrise control plane, no external inbound traffic is required.
- **Autoscaling Group**: Makes sure that a healthy Cloud Controller instance is running at a time.Instance: a t2.small instance on which the Cloud Controller runs.
- **LaunchTemplate**: Cloud Controller instance configuration. Also needed for the controller self-update feature.
- **IAM role, instance profile, and policy**: Certain permissions are necessary for the controller to query the build node states.
- **AWS Secrets Manager**: The template creates two secrets, respectively, for storing the WorkspaceID and the Controller Token.
- **CloudWatch log group**: The template creates a CloudWatch log group for storing Controller error logs.
- **Security groups**: The template creates two security groups: one for the LoadBalancer and one for the instance.

## Deploy Cloud Controller to a new VPC

Template parameters:

- **Stack Name** (required): Identifies the Bitrise Cloud Controller parent stack within the AWS Account.
- **Latest AMI ID**: This AMI ID is used as a base AMI to run the Cloud Controller on.
- **BitriseControllerToken** (required): The controller token the user receives when creating a controller on the Bitrise Website.
- **BitriseWorkspaceID** (required): The workspace ID belonging to the customer’s Bitrise account.
- **ControllerLogGroupClass** (required): The controller saves error logs to a CloudWatch log group within the customer AWS Account. The customer controls which [Log Group Class](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CloudWatch_Logs_Log_Classes.html) fits their budget the most. The default value should be suitable for most of the cases. Default: `INFREQUENT_ACCESS`.
- **ControllerLogRetentionInDays** (required): The number of days CloudWatch should retain the Controller error logs. Default: 7 (days).
- **ControllerSshKey** (required): Provides SSH access for the Cloud Controller instance.
- **EnvironmentName** (optional): Adds a prefix to each piece of Bitrise-related infrastructure with the Environment Name. In case the customer has a vast number of resources, it might come in handy to be able to distinguish Bitrise-related resources from the rest.
- **PrivateSubnet1CIDR** (required): CIDR range of the first private subnet of the new VPC. Default: 10.192.32.0/20.
- **PrivateSubnet2CIDR** (required): CIDR range of the second private subnet of the new VPC. Default: 10.192.64.0/20.
- **PublicSubnet1CIDR** (required): CIDR range of the first public subnet of the new VPC. Default: 10.192.0.0/20.
- **PublicSubnet2CIDR** (required): CIDR range of the second public subnet of the new VPC. Default: 10.192.16.0/20
- **VpcCidrBlock** (required): The CIDR block of the selected VPC.
- **CustomBashScript** (optional): Custom bash script to run on instance startup
- **UseHostNetwork (required)**: Use host network mode for Docker container (--net=host)

### Infrastructure provisioned by the template

- **Internal Application Load Balancer**: Servers have no traffic and only perform periodic health checks on the Cloud Controller instance. In all cases the Controller and the build machines will initiate network calls toward the Bitrise control plane, no external inbound traffic is required.
- **Autoscaling Group**: Makes sure that a healthy Cloud Controller instance is running at a time.
- **Instance**: a `t2.small` instance on which the Cloud Controller runs.
- **LaunchTemplate**: Cloud Controller instance configuration. Also needed for the controller self-update feature.
- **IAM role, instance profile, and policy**: Certain permissions are necessary for the controller to query the build node states.
- **AWS Secrets Manager**: The template creates two secrets, respectively, for storing the WorkspaceID and the Controller Token.
- **CloudWatch log group**: The template creates a CloudWatch log group for storing Controller error logs.
- **Security groups**: The template creates two security groups: one for the LoadBalancer and one for the instance.
- **VPC**: A standard, general-purpose VPC based on best practices. Choosing the default CIDR block results in subnets with 4096 available IP addresses. The list of VPC-related resources the template creates:

  - One VPC.
  - Two public subnets.
  - Two private subnets.
  - One NAT Gateway + one Elastic IP.
  - One Internet Gateway + one Elastic IP.
  - Routing tables.
- **Bitrise Agent Logs**: This functionality allows for seamless sending of Bitrise Agent build logs to AWS CloudWatch. It leverages CloudFormation to automatically set up the necessary IAM roles and policies, ensuring the Bitrise Agent has appropriate permissions. Moreover, it creates a specific log group in CloudWatch named `bitrise-agent-log`, facilitating organized log management and real-time analysis within the AWS environment.

## Deploy Airgapped Cloud Controller to an existing VPC

Template parameters:

- **Stack Name** (required): Identifies the Bitrise Cloud Controller parent stack within the AWS Account.
- **BitriseControllerToken** (required): The controller token the user receives when creating a controller on the Bitrise Website.
- **BitriseWorkspaceID** (required): The workspace ID belonging to the customer’s Bitrise account.
- **ControllerLogGroupClass** (required): The controller saves error logs to a CloudWatch log group within the customer AWS Account. The customer controls which [Log Group Class](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CloudWatch_Logs_Log_Classes.html) fits their budget the most. The default value should be suitable for most of the cases. Default: `INFREQUENT_ACCESS`.
- **ControllerLogRetentionInDays** (required): The number of days CloudWatch should retain the Controller error logs. Default: 7 (days).
- **ControllerSshKey** (required): Provides SSH access for the Cloud Controller instance.
- **SubnetIds** (required): At least two subnets within the same region but in different AZs. We recommend using private subnets, but public subnets work as well.
- **VpcId** (required): The VPC where the controller will be deployed.
- **VpcCidrBlock** (required): The CIDR block of the selected VPC.
- **CustomBashScript** (optional): Custom bash script to run on instance startup
- **UseHostNetwork (required)**: Use host network mode for Docker container (--net=host)

### Infrastructure provisioned by the template

- **Internal Application Load Balancer**: Servers have no traffic and only perform periodic health checks on the Cloud Controller instance. In all cases the Controller and the build machines will initiate network calls toward the Bitrise control plane, no external inbound traffic is required.
- **Autoscaling Group**: Makes sure that a healthy Cloud Controller instance is running at a time.Instance: a t2.small instance on which the Cloud Controller runs.
- **Airgapped LaunchTemplate**: Cloud Controller instance configuration. Also needed for the controller self-update feature.
- **Airgapped IAM role, instance profile, and policy**: Certain permissions are necessary for the controller to query the build node states and access required Bitrise private ECR.
- **AWS Secrets Manager**: The template creates two secrets, respectively, for storing the WorkspaceID and the Controller Token.
- **CloudWatch log group**: The template creates a CloudWatch log group for storing Controller error logs.
- **Airgapped security groups**: The template creates two security groups: one for the LoadBalancer and one for the instance.
- **Bitrise Agent Logs**: This functionality allows for seamless sending of Bitrise Agent build logs to AWS CloudWatch. It leverages CloudFormation to automatically set up the necessary IAM roles and policies, ensuring the Bitrise Agent has appropriate permissions. Moreover, it creates a specific log group in CloudWatch named `bitrise-agent-log`, facilitating organized log management and real-time analysis within the AWS environment.

### Manual configuration for the airgapped template

1. Create the following interface-type VPC endpoints using the configured subnet:

   Ensure that the private DNS is enabled for all.

   - `com.amazonaws.${AWS::Region}.autoscaling`: Used for controller self-update.
   - `com.amazonaws.${AWS::Region}.ec2`: Used for EC2 instance and dedicated host management.
   - `com.amazonaws.${AWS::Region}.ecr.api`: Used for downloading controller binary from Bitrise private ECR.
   - `com.amazonaws.${AWS::Region}.ecr.dkr`: Used for downloading controller binary from Bitrise private ECR.
   - `com.amazonaws.${AWS::Region}.logs`: Used for sending controller logs to CloudWatch.
   - `com.amazonaws.${AWS::Region}.secretsmanager`: Used for accessing secrets.
1. Apply the created endpoints to the Instance Security group.

## Deploy Airgapped Cloud Controller to a new VPC

Template parameters:

- **Stack Name** (required): Identifies the Bitrise Cloud Controller parent stack within the AWS Account.
- **Latest AMI ID**: This AMI ID is used as a base AMI to run the Cloud Controller on.
- **BitriseControllerToken** (required): The controller token the user receives when creating a controller on the Bitrise Website.
- **BitriseWorkspaceID** (required): The workspace ID belonging to the customer’s Bitrise account.
- **ControllerLogGroupClass** (required): The controller saves error logs to a CloudWatch log group within the customer AWS Account. The customer controls which [Log Group Class](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CloudWatch_Logs_Log_Classes.html) fits their budget the most. The default value should be suitable for most of the cases. Default: `INFREQUENT_ACCESS`.
- **ControllerLogRetentionInDays** (required): The number of days CloudWatch should retain the Controller error logs. Default: 7 (days).
- **ControllerSshKey** (required): Provides SSH access for the Cloud Controller instance.
- **EnvironmentName** (optional): Adds a prefix to each piece of Bitrise-related infrastructure with the Environment Name. In case the customer has a vast number of resources, it might come in handy to be able to distinguish Bitrise-related resources from the rest.
- **PrivateSubnet1CIDR** (required): CIDR range of the first private subnet of the new VPC. Default: 10.192.32.0/20.
- **PrivateSubnet2CIDR** (required): CIDR range of the second private subnet of the new VPC. Default: 10.192.64.0/20.
- **PublicSubnet1CIDR** (required): CIDR range of the first public subnet of the new VPC. Default: 10.192.0.0/20.
- **PublicSubnet2CIDR** (required): CIDR range of the second public subnet of the new VPC. Default: 10.192.16.0/20
- **VpcCidrBlock** (required): The CIDR block of the selected VPC.
- **CustomBashScript** (optional): Custom bash script to run on instance startup
- **UseHostNetwork (required)**: Use host network mode for Docker container (--net=host)

### Infrastructure provisioned by the template

- **Internal Application Load Balancer**: Servers have no traffic and only perform periodic health checks on the Cloud Controller instance. In all cases the Controller and the build machines will initiate network calls toward the Bitrise control plane, no external inbound traffic is required.
- **Autoscaling Group**: Makes sure that a healthy Cloud Controller instance is running at a time.Instance: a t2.small instance on which the Cloud Controller runs.
- **Instance**: a `t2.small` instance on which the Cloud Controller runs.
- **Airgapped LaunchTemplate**: Cloud Controller instance configuration. Also needed for the controller self-update feature.
- **IAM role, instance profile, and policy**: Certain permissions are necessary for the controller to query the build node states.
- **AWS Secrets Manager**: The template creates two secrets, respectively, for storing the WorkspaceID and the Controller Token.
- **CloudWatch log group**: The template creates a CloudWatch log group for storing Controller error logs.
- **Airgapped security groups**: The template creates two security groups: one for the LoadBalancer and one for the instance.
- **VPC**: A standard, general-purpose VPC based on best practices. Choosing the default CIDR block results in subnets with 4096 available IP addresses. The list of VPC-related resources the template creates:

  - One VPC.
  - Two public subnets.
  - Two private subnets.
  - One NAT Gateway + one Elastic IP.
  - One Internet Gateway + one Elastic IP.
  - Routing tables.
- **VPC Endpoints**: The template creates 6 interface type endpoints and connects them to the instance security group to enable controller access to AWS resources:

  - `com.amazonaws.${AWS::Region}.autoscaling`: Used for controller self-update.
  - `com.amazonaws.${AWS::Region}.ec2`: Used for EC2 instance and dedicated host management.
  - `com.amazonaws.${AWS::Region}.ecr.api`: Used for downloading controller binary from Bitrise private ECR.
  - `com.amazonaws.${AWS::Region}.ecr.dkr`: Used for downloading controller binary from Bitrise private ECR.
  - `com.amazonaws.${AWS::Region}.logs`: Used for sending controller logs to CloudWatch.
  - `com.amazonaws.${AWS::Region}.secretsmanager`: Used for accessing secrets.
- **Bitrise Agent Logs**: This functionality allows for seamless sending of Bitrise Agent build logs to AWS CloudWatch. It leverages CloudFormation to automatically set up the necessary IAM roles and policies, ensuring the Bitrise Agent has appropriate permissions. Moreover, it creates a specific log group in CloudWatch named `bitrise-agent-log`, facilitating organized log management and real-time analysis within the AWS environment.

## Necessary AWS permissions and connectivity

The controller needs certain AWS permissions to perform actions on the build nodes. We did our best to limit the required permissions to a minimal scope. We even made [our CloudFormation template repository](https://github.com/bitrise-io/cloud-controller-cloudformation/blob/production/iam/roles.yaml) public to build trust. Please see the [entire list of (up-to-date) required permissions](https://github.com/bitrise-io/cloud-controller-cloudformation/blob/production/iam/roles.yaml) in the repository.

The controller requires connectivity to certain Bitrise endpoints. See more [in the controller documentation](/en/bitrise-platform/infrastructure/bitrise-on-aws--cloud-controller/creating-and-configuring-a-controller.html).
