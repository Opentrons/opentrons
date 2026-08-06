---
title: "Compliance-Ready Features"
description: "An overview of the Flex's compliance-ready features."
---

Opentrons Flex Compliance-Ready software introduces several new, irreversible features when installed on your Flex. This section covers: 

* The different user [roles](../features/features.md#roles) that can access your compliance-ready Flex and Opentrons App. 
* The types of records and files a compliance-ready Flex generates.
* When and where [documentation](../features/documentation.md) is required while using your Flex. 
* Available [settings](../features/settings.md) to further customize your compliance-ready Flex.

On this page, read about roles, records and files, and additional features like the Flex's encryption key, optional devices, and the additional data protection compliance-ready software enables.

<!--------

TODO and comments: 
- differentiate between protocol RUN RECORDS and protocol LOG FILES. we use both and we need to be crystal clear about what the intended difference is. is a protocol run record contained in the APP or ODD and the log file is the larger .zip file that is downloaded and exported?? 
- organization note: I added the run records section to this larger page - even if these are totally separate from log files; I (so far) don't have enough to say to give this its own page.

----->



## Run records and files

All Flex robots locally generate data files when idle, when running a protocol, or when performing robot actions like homing the gantry. [Without compliance-ready software](../../../flex/docs/advanced-operation/log-files.md), users normally don't need to access these files, but have the option to download all logs as a `.zip` file.

A compliance-ready Flex generates more files and run records to preserve audit-ready information:

* **Diagnostic files**: Logs to view calibration data or provide to Opentrons Support for troubleshooting.
* **Compliance-ready files**: Logs capturing every user action with a precise timestamp, legal name and user ID, and documentation for the action.
* **Protocol run records**: Record of every protocol run with the date and run status (completed, canceled, or failed).

These records and files are yours to store, and are never viewed or stored by Opentrons. Read more about viewing, downloading, and managing [files](../files.md) in this manual.

<!----------

TODO and comments: 
- first place I differentiate between the file types. 

----->

## Devices

User actions, like setting up and running a protocol, require [documentation](../features/documentation.md) on a compliance-ready Flex. To make this easier, you can use a keyboard on the Flex touchscreen or in the Opentrons App. 

<figure class="screenshot" markdown>
  ![Image showing an open keyboard for documentation on the Flex touchscreen.](../../images/documentation-keyboard.png)
  <figcaption>Use the keyboard to enter documentation on the Flex touchscreen.</figcaption>
</figure>

Both keyboards are available in English and in Mandarin. Change your preferred langauge in the Flex's settings. Click the gray arrow on the right side of the Flex touchscreen to collapse the keyboard. 

To use a keyboard in the Opentrons App, connect an external keyboard using your Flex [front USB port](../../../flex/docs/system-description/connections.md#usb-and-auxiliary-connections). When you use an external keyboard, the keyboard on the Flex touchscreen is hidden by default

Compliance-ready Flex robots also support USB storage devices for transferring records and files from the Flex to your lab's long-term storage. Connect your USB to the Flex's [front USB port]. Read more about downloading files [here](../files.md#downloading-files).

<!--------

TODO: 
- insert side by side images if needed (for Opentrons App)
- is the keyboard collapsible in the Opentrons App? if you have an external keyboard connected?
- confirm how to connect external keyboards/any compatibility issues
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






