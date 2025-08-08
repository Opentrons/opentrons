You can upload and edit protocols you've previously made in Protocol Designer. Click **Import** to upload an existing .py or .json file. 

Your protocol details will be visible in the protocol overview. Click **Edit protocol** to make your desired changes. 

When uploading a protocol file created in a previous version, Protocol Designer will automatically update it to work with the latest version. The update process lets you use all of the latest features of Protocol Designer in your protocol, such as new modules, labware, and improved pipetting behaviors. 

!!! note
    Updating a protocol, even without changing its steps, can lead to changes in protocol execution. Always perform your necessary level of testing, such as a dry or wet run, on any newly exported protocol file.

As of Protocol Designer 8.5.0, Protocol Designer *only* exports Python protocol files, even if you imported and modified a JSON protocol. You can expect the same level of possible behavior changes when updating from a JSON to a Python protocol as in earlier JSON-to-JSON updates. 


Any updated protocol will be incompatible with previous Protocol Designer and Opentrons App versions. We recommend making a separate copy of your protocol before importing and editing. 

If you edit an exported protocol file in a text editor outside of Protocol Designer, errors could occur when re-uploading. Protocol files created outside of Protocol Designer aren't supported. 

[//]: # (are the legalese, trademarks, questions + image text at the end part of the larger theme file?)