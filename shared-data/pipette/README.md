# Pipette Spec Data

Information about our pipettes is split into 2 different files.

## Name Level: `shared-data/pipette/definitions/pipetteNameSpecs.json`

A pipette name is what is communicated with customers, what is listed in the store, etc. Name-level information does not vary across pipettes with the same "name", it includes: min and max volume, display name, number of channels, and default aspirate/dispense flow rates.

The "name" is all that is communicated to the average user about a pipette. Both JSON and Python protocols specify pipettes by name; they never specify the pipette model/version.

`"p10_single"` is an example of a name.

## Model Level: `shared-data/pipette/definitions/pipetteModelSpecs.json`

A "model" is synonymous with a part number. Our models / part numbers look like `"p10_single_v1.3"`. Although the name is a substring of the model string, it isn't a good idea to infer name by parsing it out of the model.

The model level contains information specific to particular pipette models. The model can be read off of a pipette's EEPROM at runtime. This information is required for protocol execution on the robot, but is not used directly in the code of JSON or Python protocols.

# JSON Schemas

In `shared-data/pipette/schemas/` there are JSON schemas for these files, which ensure data integrity. Further descriptions about the individual fields are written into the schemas.
