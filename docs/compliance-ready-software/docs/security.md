---
title: "Compliance-Ready Features"
description: "An overview of the Flex's compliance-ready features."
---
Opentrons Flex Compliance-Ready software introduces several new, irreversible features when installed on your Flex. This section covers features like disabled features, data protection, [external devices](devices.md), and [administrator settings](admin.md).


## Disabled features

The Opentrons Flex is an open-source liquid handling robot, and includes features that let users control the robot outside of Opentrons software. Once Compliance Ready Software is active on your Flex, open-source features that allow access outside of the touchscreen or Opentrons App, like [Jupyter notebook] and [SSH command line operation] are permanently disabled. This ensures that only your lab users can use your Flex.  

Because activating Compliance Ready Software is permanent and irreversible, a factory reset of your Flex will delete calibration data, run history, and protocols, but cannot remove Compliance Ready Software from the system. 

Before activation, a Flex can run any valid Python file developed using the Opentrons Python Protocol API. The system lockdown enabled with Compliance Ready Software means that by default, your Flex can only run protocols sent to your Flex by an administrator. To prevent new protocols from being created on the Flex by any user, Quick Transfer protocols are also permanently disabled.

## Data protection

Any action on your compliance ready Flex's touchscreen or connected Opentrons App requires a user login. Once Compliance Ready Software is activated, your Flex is blocked from running any actions, like protocol commands, unless a user is logged in.

Administrators can [customize settings](admin.md), including screen timeouts and other security policies, to further protect your data in the lab.

### Files

Your compliance ready Flex locally generates robot and protocol [files](using/files.md) to preserve audit-ready information. Every data point includes: 

* Cryptographically hashed timestamps.
* Unique electronic user IDs and signatures.

To avoid accidentally deleting these files before appropriately storing them, Compliance Ready Software prompts you to download files again before deleting them. Only administrator accounts are able to delete files.