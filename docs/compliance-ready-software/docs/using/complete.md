---
title: "Complete a protocol"
description: "Completing a protocol run in Compliance Ready Software."
---

When a protocol is complete, you'll need to sign for the run in the Opentrons App or on the Flex touchscreen. Signing for a run is the final checkpoint to completing a protocol run, and adds your legal name and user ID to every user action captured for the protocol.

!!! note
    By default, only administrator accounts can sign for a completed protocol run. Use Compliance Ready Software [settings](../admin.md#compliance-ready-software-settings) to: 

    * Allow any user to sign for a protocol run.
    * Allow users to sign for protocol runs in either the app or on the Flex touchscreen.

<figure class="screenshot" markdown>
  ![Sign for a protocol run in the Opentrons App.](../images/sign-run.png)
  <figcaption>Sign for a protocol run in the Opentrons App.</figcaption>
</figure>

After signing, your Flex will prompt you to download audit logs. Audit logs are [files](files.md) the Flex generates containing data like responsible users, timestamps, and documentation for every robot action. 

By default, these files are not saved to the Flex to save space. You'll need to downloaded them after signing for your protocol run. 

<figure class="screenshot" markdown>
  ![Download audit logs.](../images/download-logs-odd.png)
  <figcaption>Download audit logs from the Flex touchscreen.</figcaption>
</figure>

Administrators can [change](../settings.md#download-files-after-a-run) this setting to save audit logs locally on your Flex. Remember that you'll still need to frequently download and delete logs from the robot.

When you're finished, end your session on the Flex by swiping down on the touchscreen or clicking the account icon in the top right to log out.

You can download additional protocol [files](files.md#) before you log out, or in your next session. 