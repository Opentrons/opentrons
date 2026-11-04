---
title: "Protocol Designer: Modifying a Protocol"
description: "Change robot, instruments, deck, or steps in an existing protocol."
---

You can upload and edit protocols you've previously made in Protocol Designer. Click **Import** to upload an existing .py or .json file. 

Your protocol details will be visible in the protocol overview. Click **Edit protocol** to make your desired changes. 

When uploading a protocol file created in a previous version, Protocol Designer will automatically update your protocol steps and labware to the latest version. The update process lets you use all of the latest features of Protocol Designer in your protocol, such as new modules, labware, and improved pipetting behaviors.

!!! note
    Updating a protocol, even without changing its steps, can lead to changes in protocol execution. Always perform your necessary level of testing, such as a dry or wet run, on any newly exported protocol file.

As of Protocol Designer 8.5.0, Protocol Designer *only* exports Python protocol files, even if you imported and modified a JSON protocol. You can expect the same level of possible behavior changes when updating from a JSON to a Python protocol as in earlier JSON-to-JSON updates. 

!!! warning
    Liquid class settings are available to optimize your liquid handling steps. When you import an existing protocol in Protocol Designer 8.5.0 or later: 
    
    - custom settings like blowout locations or delay positions are removed. 
    - any steps with errors won't be exported in your new protocol. 

    Be sure to enter new positions for your advanced settings. We always recommend fixing all errors before exporting any Protocol Designer protocol. 


## Updated Protocols

Any updated protocol will be incompatible with previous Protocol Designer and Opentrons App versions. We recommend making a separate copy of your protocol before importing and editing. 

If you edit an exported protocol file in a text editor outside of Protocol Designer, errors could occur when re-uploading. Protocol files created outside of Protocol Designer aren't supported. 
