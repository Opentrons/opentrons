---
title: "Compliance-Ready Settings"
description: "An overview of the Flex's compliance-ready setings, and who has permission to update them."
---

Administrators can customize compliance ready settings in the Opentrons App and on the Flex touchscreen.

For a complete list of Flex robot settings, see the [Flex Instruction Manual]. 

## Access settings

In the Opentrons App, click the **Devices** page on the left side, then choose **Robot Settings**. Click the **Compliance Ready** tab to view available settings.

<figure class="screenshot" markdown>
  ![Image showing an open keyboard for documentation on the Flex touchscreen.](images/crs-settings-app.png)
  <figcaption>Access Compliance Ready Software settings in the Opentrons App.</figcaption>
</figure>

The administrator view shown above includes personal account settings, user managament, and Compliance Ready Software settings. When logged in, users will only be able to manage their [personal account settings](#personal-account-settings).

On the Flex touchscreen, tap the **Settings** tab, then **Compliance Ready Software**. 

<figure class="screenshot" markdown>
  ![Image showing an open keyboard for documentation on the Flex touchscreen.](images/crs-settings-odd.png)
  <figcaption>Use the keyboard to enter documentation on the Flex touchscreen.</figcaption>
</figure>

Not all Compliance Ready Software settings are available from the Flex touchscreen. For example, administrators can only create accounts, and aren't able to delete accounts or reset passwords. 

The sections below cover every Compliance Ready Software setting available in the Opentrons App. 

## Personal account settings 

In personal account settings, every user can update their username, legal name, and password. Usernames are restricted to 20 characters on the Flex.

Administrators can customize password settings, like character length, whether to include special characters, and how often users will need to update their passwords.

Users can only make changes to their personal account settings, and can't view or customize settings in User Management or Compliance Ready Software settings. 

## User management

Administrators can unlock or delete users accounts, reset passwords, or edit user permissions. 

<figure class="screenshot" markdown>
  ![Image showing admin controls for user management.](images/create-account.png)
  <figcaption>Administrators can manage user accounts in compliance-ready settings.</figcaption>
</figure>

All accounts are locked by default after 5 failed login attempts. An administrator must unlock a locked account and provide the user with their one-time password. Users can choose a new password after successfully logging in.

<figure class="screenshot" markdown>
  ![Image showing a one time password generation for a locked user account.](images/one-time.png)
  <figcaption>Administrators can unlock user accounts with a one-time password.</figcaption>
</figure>

If your lab [loses access](roles.md#account-recovery) to all administrator accounts, Opentrons offers a paid on-site recovery service.


## Compliance Ready Software settings

Administrators can make changes to security, documentation, and storage settings to customize your lab's daily user experience.

| **Setting** | **Options** | 
| :--------|---------------- |
| **Login attempts** | <ul><li>Maximum login attempts before the account locks.</li><li>Default: 5.</li></ul> |
| **Passwords** | <ul><li>Time before user passwords must be changed (default: 30 days).</li></li><li>Password complexity, like minimum length (default: 20 characters) or special character requirements</li></ul> |
| **Screen timeout** | <ul><li>Time before the Opentrons App or Flex touchscreen lock due to inactivity.</li><li>Default: 3 minutes.</li></ul> |
| **User permissions** | <ul><li>Whether administrator credentials are required to update the Flex, send protocols to the Flex, or sign to complete a protocol run.</li></ul> |
| **Documentation** | <ul><li>Whether to require documentation for robot actions, like dropping attached tips or homing the gantry.</li><li>Set minimum character length (default: 20 characters).</li></ul> |
| **Files** | <ul><li>Whether to require protocol logs to be in the Opentrons App.</li><li>Automatically delete protocol logs when the Flex reaches its storage limit (20 logs).</li></ul> |

## File source folder

You can choose a location to automatically download and save [files](using/files.md) from the Opentrons App.

Click the :material-cog: in the lower left to access **App settings**. Select the **Advanced** tab and click **Select folder** to choose a storage location from your computer's directory.

If robot settings, like your Flex's name, are ever changed, you may need to repeat this process.

<figure class="screenshot" markdown>
  ![Image showing an open keyboard for documentation on the Flex touchscreen.](images/source-folder.png)
  <figcaption> Set a location on your computer to download files to from the Opentrons App.</figcaption>
</figure>

