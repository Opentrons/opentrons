---
title: "Compliance-Ready Features"
description: "An overview of the Flex's compliance-ready features."
---

Opentrons Flex Compliance-Ready software introduces several new, irreversible features when installed on your Flex. This section covers: 

Opentrons Flex Compliance-Ready software introduces several new, irreversible features when installed on your Flex.

NEED TO ADD disabled features here 

Activation Compliance Ready Software on your Flex is permanent and irreversible. The software changes the way you interact with your Flex on a daily basis. You'll also lose access to some Flex features: 

* [**Jupyter Notebook**](../../../flex/docs/advanced-operation/jupyter-notebook.md) and [**Secure Shell (SSH)**](../../../flex/docs/advanced-operation/command-line.md) connections: You won't be able to control your Flex through web server or terminal connections.
* **Run any valid Python file**: Before installation, your Flex can run any valid Python file developed using the Opentrons Python Protocol API. A compliance-ready Flex can only run verified Python protocols approved and added by an administrator.
* **Factory resets**: A reset of your Flex will delete calibrations, run history, and protocols, but cannot remove compliance-ready software. 

<!--------

TODO and comments: 
- differentiate between protocol RUN RECORDS and protocol LOG FILES. we use both and we need to be crystal clear about what the intended difference is. is a protocol run record contained in the APP or ODD and the log file is the larger .zip file that is downloaded and exported?? 
- organization note: I added the run records section to this larger page - even if these are totally separate from log files; I (so far) don't have enough to say to give this its own page.

----->





<!----------

TODO and comments: 
- first place I differentiate between the file types. 

----->



## Data protection

Opentrons Flex compliance-ready software includes additional features to protect and preserve your data. 

### Verified users

Any action on the Flex touchscreen or connected Opentrons App requires a user login. When inactive, the touchscreen and app will lock again. Screen timeouts and other security policies can be customized in [administrator settings](../features/settings.md).

## System lockdown

Flex features that allow access outside of the touchscreen or Opentrons App, like [Jupyter notebook](../../../flex/docs/advanced-operation/jupyter-notebook.md) and [SSH command line operation](../../../flex/docs/advanced-operation/command-line.md), are permanently disabled in compliance-ready software.

System lockdown to prevent any unauthorized use also means that Python protocols must be verified and sent to the Flex by users with permission. Only Python files that complete this process can be run on the Flex.

### Files

Your compliance-ready Flex locally generates robot and protocol logs to preserve audit-ready information. Every data point includes: 

* cryptographically hashed timestamps.
* unique electronic user IDs and signatures.

To avoid accidentally deleting these files before appropriately storing them, compliance-ready software includes two checkpoints before you'll be able to delete files.


<!---------

TODO: 
- beef up the pyro section here... after discussion with Casey and Alex next week
- make sure two checkpoints is accurate... users must 1) tap the run record or user action log, or select all 2) users must choose to delete 3) users must choose AGAIN that they'd like to delete, and choose this over an option to download

-------------->






