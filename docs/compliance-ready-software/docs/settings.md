---
title: "Settings"
description: "Settings that can be used to customize a compliance ready Flex during setup."
---

During Opentrons Flex Compliance Ready Software activation, an Opentrons-trained representative can help you change settings to customize your day-to-day experience.

Adminstrator accounts have the option to change these settings again later. For more, see the full list of [administrator settings](admin.md).

## Completing a run 

When you finish a protocol run, the responsible user must sign to mark the run as [complete](using/complete.md). This process adds the user's legal name and user ID to every action captured in the protocol and documentation.

You can decide to set the Opentrons App as the only place runs can be completed. Users will need to:

<div class="instruction-list" markdown>

1. Sign for the run in the Opentrons App, instead of on the Flex's touchscreen.
2. Download protocol [files](using/files.md) from the Opentrons App. 

## File downloads

When you run protocols, your compliance ready Flex locally generates different files, including *audit logs*, containing robot and protocol data. These files are yours to safely store, and are never viewed or stored by Opentrons. Read more about [files](using/files.md) in this manual.

If you choose to restrict users to signing for a run only in the Opentrons App, you'll also need to configure the app to download the audit logs associated with each protocol run to a storage location. 

<figure class="screenshot" markdown>
![Image showing how to choose a storage location.](images/storage-location.png)
</figure>
<figcaption>Choose a storage location for your files.</figcaption>

Click the **Advanced** tab in **App Settings**. Next, click **Select folder** to choose a storage location from your computer's directory for audit logs.

If robot settings, like your Flex's name, are ever changed, you may need to repeat this process.

!!! note
    There's more than one way to move files from your Flex to a storage location. You can also attach a [USB](devices.md) and move the files to a computer yourself from the Flex touchscreen.