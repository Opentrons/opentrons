---
title: "Compliance-Ready Settings"
description: "An overview of the Flex's compliance-ready setings, and who has permission to update them."
---

Administrators and users they give permission to can make changes to and customize some compliance-ready features in the Opentrons App. 

In the app, choose robot settings for your device, then select the **Compliance Ready** tab. For a complete list of Flex robot settings, see the [Flex Instruction Manual](../../../flex/). 

<!---------

TODO + comments: 
- fairly confident that "and users they give permission to" is incorrect here, but triple check
-------------->

## Protocol records and logs

Your compliance-ready Flex needs a secure location to export protocol [files](../files.md) to. Administrators can change this location in the Opentrons App settings. 

Under your Flex's settings, select the **Advanced** tab and click to select a folder under **Protocol Logs Source Folder**.

Select the folder you'd like to save all protocol logs in. Each time you make changes, you'll need to officially authorize the new storage location: 

1. Export a protocol log. 
2. Place the protocol log in the new, secure location. 
3. View the protocol log in the log viewer.

<!---------

TODO + comments: 
- does it make sense to export the log and then place it in the new, secure location? isn't this automated when users select the storage location? this is text from the PRD etc. so check this in the software flow
- do you need to enter documentation when changing the secure storage location?
- also, need to check the process users will complete to authorize the storage location if we don't launch with the log viewer. make any required changes in activation > log storage too
- maybe add an image if I can find the right one (or test in the alpha). doesn't show anything besides the "advanced" settings tab in designs.
-------------->

## Accounts

Administrators can make changes to users accounts. In the Opentrons App, click **Robot Settings**, then choose **Compliance Ready Software**. Here, unlock or delete users accounts, reset passwords, or edit user permissions. 

<figure class="screenshot" markdown>
  ![Image showing admin controls for user management.](../../images/user-management.png)
  <figcaption>Administrators can manage user accounts in compliance-ready settings.</figcaption>
</figure>

User accounts are locked by default after 5 failed login attempts. After unlocking an account, users will receive a one-time password, and can choose a new one after logging in.

<figure class="screenshot" markdown>
  ![Image showing a one time password generation for a locked user account.](../../images/user-management.png)
  <figcaption>Administrators can unlock user accounts with a one-time password.</figcaption>
</figure>

If your lab loses administrator access, Opentrons offers an on-site recovery service. 

<!-----
TODO and comments: 
- who should I direct users to for an on-site recovery service? start with support? I don't want to continually update the price, but maybe we should just call it "paid" to underline the severity
- under the "compliance ready" tab, regular users can make changes to their username, legal name, and password. can add this text + an image here
------>

## Customize compliance-ready software

Although compliance-ready software is permanently installed and can't be removed from your Flex, administrators can customize some settings for a different user experience. 

| **Setting** | **Options** | 
| :--------|---------------- |
| **Login attempts** | <ul><li>Maximum login attempts before the account locks.</li><li>Default: 5.</li></ul> |
| **Passwords** | <ul><li>Time before user passwords must be changed (default: 30 days).</li></li><li>Password complexity, like minimum length or special character requirements</li></ul> |
| **Screen timeout** | <ul><li>Time before the Opentrons App or Flex touchscreen lock due to inactivity.</li><li>Default: 3 minutes.</li></ul> |
| **Documentation** | <ul><li>Whether to require documentation for robot actions, like dropping attached tips or homing the gantry.</li><li>Set minimum character length (default: 20 characters).</li></ul> |
| **Protocol logs** | <ul><li>Whether to require protocol logs to be signed and saved in the Opentrons App.</li><li>Automatically delete protocol logs when the Flex reaches its storage limit (20 logs).</li></ul> |
| **User permissions** | <ul><li>Whether administrator credentials are required for updating the Flex, sending protocols to the Flex, or signing run protocol run records.**</li></ul> |

<!---------

TODO and comments: 
- reinforce in this section that admins can find all these settings in a single place (compliance ready tab) IF true that these are found only in a single place
- any differences for app vs ODD? re: what settings can be accessed? 
- for regular users, the only thing that appears under "compliance ready" tab is their personal account settings: username, legal name, password. 
- do both the app and ODD lock upon screen timeout? 
- check what `robot actions` reallys means; what does this include
-------------->

