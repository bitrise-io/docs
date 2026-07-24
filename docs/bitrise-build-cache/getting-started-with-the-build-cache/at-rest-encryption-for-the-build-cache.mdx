---
title: "At-rest encryption for the Build Cache"
description: "[Bitrise Build Cache](https://bitrise.io/platform/devops/build-caching) protects customer data with at-rest encryption using envelope encryption and AES-256-GCM."
sidebar_position: 3
slug: /bitrise-build-cache/getting-started-with-the-build-cache/at-rest-encryption-for-the-build-cache
---

[Bitrise Build Cache](https://bitrise.io/platform/devops/build-caching) protects customer data with at-rest encryption using envelope encryption and AES-256-GCM.

## At-rest encryption overview

- A unique Data Encryption Key (DEK) is generated for each customer.
- The DEK is encrypted using a Key Encryption Key (KEK), which is generated and managed by a Key Management System (KMS). For example, Google KMS.
- We rotate the KEK every 90 days for enhanced security.
- The encrypted DEKs are stored securely in our database, but the DEK never persists in its decrypted form—it is only used in memory when encrypting or decrypting data.
- The DEK is used to encrypt customer data, ensuring that sensitive information is securely stored at rest.

KEK and DEKs are never stored together, ensuring strong isolation. The raw KEK is never exposed: it is only used within KMS to encrypt and decrypt DEKs securely. This approach ensures strong encryption, safe key handling, and a high level of data protection for our customers.

## Security benefits

- Strong encryption: AES-256-GCM is a widely trusted encryption standard that provides robust protection for sensitive data.
- Customer isolation: Each customer has a unique DEK, meaning that if one customer's key were to be compromised, no other customers' data would be affected. Accessing encrypted data alone does not provide access to decrypted data.
- Regulatory compliance: Our at-rest encryption aligns with best practices recommended by security and privacy regulations, including:

  - **GDPR (General Data Protection Regulation)**: Encourages encryption as a data protection measure.
  - **CCPA (California Consumer Privacy Act)**: Encrypted data may be exempt from certain breach liability requirements.
  - **SOC 2**: Supports encryption as a key security control for compliance.
  - **ISO/IEC 27001**: Recommends encryption for securing stored data.
  - **NIST (National Institute of Standards and Technology)**: Provides encryption standards (for example, AES-256) to ensure strong data protection and compliance with industry security frameworks.

## Customer-managed Encryption Keys

For customers seeking greater control over their encryption, we offer the option to use Customer-Managed Encryption Keys (CMEKs).

With CMEKs, customers can store their Key Encryption Key (KEK) in their own Google Cloud KMS or Amazon KMS, allowing them to:

- Maintain full control: Manage their own KEKs, including creation, rotation, and revocation.
- Enhance security compliance: Ensure that only they have access to their encryption keys, aligning with strict internal security policies.

If you're interested in using CMEKs, [contact us](https://bitrise.io/contact) to discuss your requirements.
