---
title: "Compliance-Ready Features"
description: "An overview of the Flex's compliance-ready features."
---
Opentrons Flex Compliance-Ready software introduces several new, irreversible features when installed on your Flex. This section covers features like disabled features, data protection, external [devices](../docs/devices.md), and [administrator settings](../docs/admin.md).


## Disabled features

The Opentrons Flex is an open-source liquid handling robot, and includes features that let users control the robot outside of Opentrons software. Once Compliance Ready Software is active on your Flex, open-source features that allow access outside of the touchscreen or Opentrons App, like [Jupyter notebook](../../../flex/docs/advanced-operation/jupyter-notebook.md) and [SSH command line operation](../../../flex/docs/advanced-operation/command-line.md), are permanently disabled. This ensures that only your lab users can use your Flex.  

Because activating Compliance Ready Software is permanent and irreversible, a factory reset of your Flex will delete calibration, run history, and protocols, but cannot remove Compliance Ready Software from the system. 

Before activation, a Flex can run any valid Python file developed using the Opentrons Python Protocol API. The system lockdown enabled with Compliance Ready Software means that your Flex can only run approved Python protocols. By default, only an administrator account can send new protocols to your compliance ready Flex. Users will only be able to run these protocols.

## Data protection

Any action on your compliance ready Flex's touchscreen or connected Opentrons App requires a user login. Once Compliance Ready Software is activated, your Flex is blocked from running any actions, like protocol commands, unless a user is logged in.

Screen timeouts and other security policies can be customized by [administrators](../features/settings.md) to further protect your data in the lab.

### Files

Your compliance ready Flex locally generates robot and protocol [files](../docs/files.md) to preserve audit-ready information. Every data point includes: 

* cryptographically hashed timestamps.
* unique electronic user IDs and signatures.

To avoid accidentally deleting these files before appropriately storing them, Compliance Ready Software includes two checkpoints before you'll be able to delete files.
