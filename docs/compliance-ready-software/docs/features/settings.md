---
title: "Compliance-Ready Settings"
description: "An overview of the Flex's compliance-ready setings, and who has permission to update them."
---

Administrators and users they give permission to can make changes to and customize some compliance-ready features in the Opentrons App. 

For a complete list of Flex settings, see [link Flex manual]. 

## Protocol logs

Your compliance-ready Flex needs a secure location to export protocol [log files] to. Administrators can change this location in **Advanced App Settings**. 

**insert image**

Select the folder you'd like to save all protocol logs in. Each time you make changes, you'll need to officially authorize the new storage location: 

1. Export a protocol log. 
2. Place the protocol log in the new, secure location. 
3. View the protocol log in the log viewer.

<!---------

TODO: 
- link relevant sections
- does it make sense to export the log and then place it in the new, secure location? isn't this automated when users select the storage location? this is text from the PRD etc. so check this in the software flow
- also, need to check the process users will complete to authorize the storage location if we don't launch with the log viewer. make any required changes in activation > log storage too
- can users customize any settings at all? is it only admins? or can they give users additional permissions? 
- are there any settings that can be customized on the ODD? 
- make sure **Advanced App Settings** is the real title and is clickable
-------------->

## Accounts

Administrators can make changes to users accounts. In the Opentrons App, click **Robot Settings**, then choose **Compliance Ready Software**. Here, unlock or delete users accounts, reset passwords, or edit user permissions. 

**image: available account settings in the app (if I can show them)

User accounts are locked by default after [insert number] failed login attempts. After unlocking an account, users will receive a one-time password, and can choose a new one after logging in. 

If your lab loses administrator access, Opentrons offers an on-site recovery service. 

## Customize compliance-ready software

Although compliance-ready software is permanently installed and can't be removed from your Flex, administrators can customize some settings for a different experience. 

| **Setting** | **Options** | 
| :--------|---------------- |
| **Login attempts** | <ul><li>Maximum login attempts before the account locks.</li><li>Default: 5.</li></ul> |
| **Passwords** | <ul><li>Time before user passwords must be changed (default: 30 days).</li></li><li>Password complexity, like minimum length or special character requirements</li></ul> |
| **Screen timeout** | <ul><li>Time before the Opentrons App or Flex touchscreen lock due to inactivity.</li><li>Default: 3 minutes.</li></ul> |
| **Documentation** | <ul><li>Whether to require documentation for robot actions, like dropping attached tips or homing the gantry.</li><li>Set minimum character length (default: 20 characters).</li></ul> |
| **Protocol logs** | <ul><li>Whether to require protocol logs to be signed and saved in the Opentrons App.</li><li>Automatically delete protocol logs when the Flex reaches its storage limit (20 logs).</li></ul> |
| **User permissions** | <ul><li>Whether administrator credentials are required for updating the Flex, sending protocols to the Flex, or signing run protocol run records.**</li></ul> |

**insert text about *where* admins can find these settings

<!---------

TODO: 
- confirm whether admins can find all these settings in a single place; may need an image
- anything users can edit, or is it only admin accounts? 
- any differences for app vs ODD? re: what settings can be accessed? 
- do both the app and ODD lock upon screen timeout? 
- check what `robot actions` reallys means; what does this include
-------------->

