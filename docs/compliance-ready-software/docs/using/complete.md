---
title: "Complete a protocol"
description: "Completing a protocol run in Compliance Ready Software."
---

When a protocol is complete, you'll need to sign for the run in the Opentrons App or on the Flex touchscreen. Signing for a run is the final checkpoint to completing a protocol run, and adds your legal name and user ID to every user action captured for the protocol.

!!! note
    By default, only administrator accounts can sign for a completed protocol run. Use Compliance Ready Software [settings](../admin.md#compliance-ready-software-settings) to: 

    * Allow any user to sign for a protocol run.
    * Choose whether users can sign for protocol runs in the Opentrons App or on the Flex touchscreen.

<figure class="screenshot" markdown>
  ![Sign for a protocol run in the Opentrons App.](../images/sign-run.png)
  <figcaption>Sign for a protocol run in the Opentrons App.</figcaption>
</figure>

After signing, your Flex will prompt you to download audit logs. [Audit logs](files.md) are files the Flex generates containing data like responsible users, timestamps, and documentation for every robot action. 

To conserve space, these files are not saved to the Flex by default. Instead, they're saved in the Opentrons App, where you'll need to downloaded them after signing for your protocol run. 

<figure class="screenshot" markdown>
  ![Download audit logs.](../images/download-logs-odd.png)
  <figcaption>The Flex touchscreen prompts you to download audit logs in the Opentrons App after a run.</figcaption>
</figure>

Administrators can [change](../settings.md#download-files-after-a-run) this setting to save audit logs locally on your Flex. Remember that you'll still need to frequently download and delete logs from the robot.

When you're finished, end your session on the Flex by logging out: 

* In the Opentrons App, click the account icon in the top right and choose **Log out**.
* On the Flex touchscreen, press and hold at the top of the screen. Drag the screen down to the bottom of the touchscreen and release to log out. 

You can download additional protocol files before you log out, or in your next session. 