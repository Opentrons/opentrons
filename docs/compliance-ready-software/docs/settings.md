---
title: "Settings"
description: "Settings that can be used to customize a compliance ready Flex during setup."
---

During Opentrons Flex Compliance Ready Software activation, an Opentrons-trained representative can help you change settings to customize your day-to-day experience.

Adminstrator accounts have the option to change these settings again later. For more, see the full list of [administrator settings](admin.md).

## Completing a run 

When you finish a protocol run, the responsible user must sign to mark the run as [complete](complete.md).

You can decide to set the Opentrons App as the only place runs can be completed. Users will need to:

1. Sign for the run in the Opentrons App, instead of on the Flex's touchscreen.
2. Download protocol [files](files.md) from the Opentrons App. 

## File downloads

When you run protocols, your compliance ready Flex locally generates files containing robot and protocol data. These log files are yours to safely store, and are never viewed or stored by Opentrons. Read more about [files](files.md) in this manual.

If you choose to restrict users to signing for a run only in the Opentrons App, you'll also need to configure the app to download these logs to a storage location. 

<figure class="screenshot" markdown>
![Image showing how to choose a storage location.](../images/storage-location.png)
</figure>
<figcaption>Choose a storage location for your files.</figcaption>

Click the **Advanced** tab in **App Settings**. Next, click **Select folder** to choose a storage location from your computer's directory for audit logs and other [files](files.md).

If robot settings, like your Flex's name, are ever changed, you may need to repeat this process.

!!! note
    There's more than one way to move files from your Flex to a storage location. You can also attach a [USB](devices.md) and move the files to a computer yourself from the Flex touchscreen.

<!--------

TODO and comments: 
- this image isn't great. see if I can find something more detailed... like what happens after you click **select folder**
- inconsistent naming in the UI continues to be a problem. "audit logs" is a phrase used inconsistently throughout. need to check this in the alpha, because I know this an ongoing conversation between devs and design
----->