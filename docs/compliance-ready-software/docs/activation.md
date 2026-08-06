---
title: "Activation"
description: "What users need to know about activating Flex Compliance-Ready Software."
---

Activating Opentrons Flex Compliance Ready Software permanently adds technical controls, like required documentation and user access, for FDA regulation 21 CFR part 11–ready operation. 

An Opentrons-trained representative will install and activate Compliance Ready Software during an on-site visit. The price of the software includes installation, activation, and training.

During activation, your representative will first install the software using a **service PIN** unique to your robot. This is only used for activation, and your lab will never need to access it again. 

Next, they'll use an **encryption key** to establish a connection between your unique Flex and the Opentrons App. This ensures that only approved users can control the Flex and access its records through your app. 

The encryption key is a three-word string. In Flex settings on the touchscreen or in the Opentrons App, first click **Robot encryption key**, then choose **View encryption key**.

<figure class="screenshot" markdown>
  ![Image showing the robot-generated encryption key.](../../images/encryption-key.png)
  <figcaption>The robot-generated encryption key changes every 30 seconds.</figcaption>
</figure>

Your Flex will generate a new key every 30 seconds.

<!--------

TODO: 
- any differences between app and ODD?
- can update this png myself for a more realistic encryption key later
- link to glossary after I build it

----->

Finally, your representative will create accounts for your lab to use, assigned either an administrator or user [role](../docs/roles.md). You'll also be able to customize Compliance Ready Software [settings](../docs/settings.md).

After setup, a "Compliance Ready" badge appears next to your Flex in the Opentrons App.

<figure class="screenshot" markdown>
  ![Image showing a compliance-ready Flex in the app.](../../images/compliance-ready-badge.png)
  <figcaption>Your Opentrons App can control multiple robots, including a mix of Flex, compliance-ready Flex, and OT-2 robots.</figcaption>
</figure>

!!! note
    Remember that you can control multiple robots through the same Opentrons App, including those that don't have Compliance Ready Software. The way you use the app to interact with a compliance ready Flex will be different, including logins, protocol runs, and required documentation.

After activation, you'll need to add your own validations, protocols, and data management practices to make your Flex fully audit-ready.


