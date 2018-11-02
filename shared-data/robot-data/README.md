# Pipette Spec Data

Information about our pipettes is split into 2 different files.

## Model Level: `pipetteModelSpecs.json`

Model-level information does not vary across pipette models: min and max volume, display name, number of channels, and default aspirate/dispense flow rates.

The "model" is all that is communicated to the average user about a pipette. Both JSON and Python protocols specify pipettes by model; they never specify the pipette version.

`"p10_single"` is an example of a model.

## Version Level: `pipetteVersionSpecs.json`

The version level contains information specific to particular pipette versions. A "versioned model" like `p10_single_v1.3` corresponds to a part number. The "versioned model" can be read off of a pipette's SD card at runtime. This information is required for protocol execution on the robot, but is not used in JSON or Python protocols.

# JSON Schemas

In `shared-data/pipetteSpecSchemas` there are JSON schemas for these 2 JSON files, which ensure data integrity. Further descriptions about the individual fields are written into the schemas.
