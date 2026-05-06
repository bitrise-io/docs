---
title: "Endpoint Detection and Response"
description: "Endpoint Detection and Response (EDR) tools monitor endpoint activity and alert security teams about suspicious behavior. They are commonly used on employee laptops and long‑lived servers. Bitrise does not use EDR agents on Bitrise‑hosted CI runners."
sidebar_position: 9
slug: /bitrise-platform/integrations/endpoint-detection-and-response
---

## No EDR on Bitrise CI runners

Endpoint Detection and Response (EDR) tools monitor endpoint activity and alert security teams about suspicious behavior. They are commonly used on employee laptops and long‑lived servers.

Bitrise does use EDR internally as part of our corporate security program. This use does not extend to EDR agents on Bitrise‑hosted CI runners. Bitrise build VMs are ephemeral, short‑lived environments optimized for CI/CD performance. Running EDR in this context introduces tradeoffs:

- Performance and reliability impact: EDR agents consume CPU, memory, and I/O, and can slow down or interfere with performance‑sensitive builds. Since Bitrise build VMs commonly run at or near 100% CPU during builds, additional overhead can negatively affect build times and reliability.
- Most commercial EDR solutions are primarily optimized for long‑lived endpoints. On short‑lived, compute‑intensive CI/CD runners, their effectiveness is more limited, while the performance and operational costs remain.
- Alternative controls: Instead of EDR on build VMs, Bitrise focuses on other security controls better suited to the CI/CD context (for example, hardened base images and image scanning).

## Options for users who require EDR

Customers with strict EDR requirements can deploy and manage their own EDR solution on suitable Bitrise infrastructure.

Customers using private or dedicated clusters can:

- Use pre‑warm or similar mechanisms to install and configure their own EDR agents before builds start.
- Use their own EDR licenses, policies, and backend systems.

In this model:

- The customer is responsible for selecting, installing, configuring, and maintaining the EDR solution.
- All alerts, telemetry, and incident response activities are handled by the customer’s own security operations capabilities.
- Bitrise does not operate, monitor, or manage the customer’s EDR agents.

:::tip[Contact us]

If you have any questions regarding your security requirements, contact us at letsconnect@bitrise.io.

:::
