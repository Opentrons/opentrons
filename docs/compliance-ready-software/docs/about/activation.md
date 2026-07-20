---
title: "Activation"
description: "What users need to know about activating Flex Compliance-Ready Software."
---

Flex Compliance-Ready software is installed onsite by an Opentrons-trained representative. The price of the software includes this installation, activation, and training. 

Activating Compliance-Ready software on your Flex is permanent and irreversible. Installation changes the way you interact with your Flex on a daily basis. You'll also lose access to some Flex features: 

* [**Jupyter Notebook**](../../../flex/docs/advanced-operation/jupyter-notebook.md) and [**Secure Shell (SSH)**](../../../flex/docs/advanced-operation/command-line.md) connections: You won't be able to control your Flex through web server or terminal connections. 
* **Factory resets**: A reset of your Flex will delete calibrations, run history, and protocols, but cannot remove Compliance-Ready software. 

Compliance-ready software makes changes to both the Flex touchscreen and the Opentrons App on your computer. Once activated, a "Compliance ready" badge appears next to your Flex in the app.

<figure class="screenshot" markdown>
![Image showing a compliance-ready Flex in the app.](../images/)
</figure>

Remember that you can control multiple robots through the same Opentrons App, including those that don't have compliance-ready software. The way you [use the app](../) to interact with a compliance-ready Flex will be different, including logins, protocol runs, and required documentation.

## Log storage 

When you run protocols, a compliance-ready Flex locally generates robot and protocol logs that you'll need to store. These log files are yours to store, and are never viewed or stored by Opentrons. Read more about [log files] in this manual. 

During activation, the Opentrons App will be configured to save these logs in a secure storage location. As soon as the compliance-ready software is installed, a log should be exported, placed in the secure storage location, and viewed in the log viewer to officially authorize the process. 

If robot settings, like your Flex's name, are ever changed, you may need to repeat this process.

<!--------

TODO: 
- confirm factory reset language 
- add image from Figma
- confirm language around the process of blessing the robot identity
- link relevant log files section
- when is the encryption key set up? should it get a mention here? 

----->

