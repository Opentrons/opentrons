# Pipette Configurations

## Schema Version 2

Information about our pipettes is now split into 3 different categories of data. Each data file is organized into `<configuration_type>/<pipette_type>/<pipette_model>/<pipette_version>`.

- `configuration_type` is the top level category of data (i.e. `geometry` or `liquid`)
- `pipette_type` is the type of pipette generally referred to by the channel size (i.e. `single_channel` or `eight_channel`)
- `pipette_model` is the max volume of the pipette (i.e. `p50` or `p1000`)
- `pipette_version` is the version number flashed to the pipette (i.e. `v1` or `v1.2`)

This organization is subject to change based on the model name changes that product might make.

### Geometry Configurations: `shared-data/pipette/schemas/2/pipetteGeometrySchema.json`

Pipette geometry configurations includes physical properties that map the pipette end effector in space. In this section of data, we would also like to store 3D model descriptor files that are compatible with typescript and other 3D modeling visualization software for future applications.

We are planning to use [gltf](https://www.khronos.org/gltf/) formatted files as you can choose your 3D model anchors inside solidworks and export the file.

### Liquid Configurations: `shared-data/pipette/schemas/2/pipetteLiquidPropertiesSchema.json`

Pipette liquid configurations include all pipette properties that may affect liquid handling. This includes pipetting function and default flow rates based on tip size.

We have now added in the ability to categorize liquid handling properties by tip type (which can also vary by brand). Eventually, we may need this to be more complex than just a look up dictionary of `tip_type` : `brand+liquid` but we can decide to make that change at a different time.

### General Properties Configurations: `shared-data/pipette/schemas/2/pipettePropertiesSchema.json`

Pipette general properties should be similar to schema version 1 name specs that are shared across pipette type + model.

## Schema Version 1

Information about our pipettes is split into 2 different files.

### Name Level: `shared-data/pipette/schemas/1/pipetteNameSpecs.json`

A pipette name is what is communicated with customers, what is listed in the store, etc. Name-level information does not vary across pipettes with the same "name", it includes: min and max volume, display name, number of channels, and default aspirate/dispense flow rates.

The "name" is all that is communicated to the average user about a pipette. Both JSON and Python protocols specify pipettes by name; they never specify the pipette model/version.

`"p10_single"` is an example of a name.

### Model Level: `shared-data/pipette/schemas/1/pipetteModelSpecs.json`

A "model" is synonymous with a part number. Our models / part numbers look like `"p10_single_v1.3"`. Although the name is a substring of the model string, it isn't a good idea to infer name by parsing it out of the model.

The model level contains information specific to particular pipette models. The model can be read off of a pipette's EEPROM at runtime. This information is required for protocol execution on the robot, but is not used directly in the code of JSON or Python protocols.

## JSON Schemas

In `shared-data/pipette/schemas/` there are JSON schemas for these files, which ensure data integrity. Further descriptions about the individual fields are written into the schemas.
