# Overview

This is a simple browser tool which can be used to generate labware definitions for _regular_ labware.
In the coming months, we will be adding more features to the GUI as well as the ability to generate definitions
for _irregular_ labware.

### What is a 'regular' labware?

* A labware in which the grid shape is uniform
..* No uneven number of rows or columns
* Spacing between columns and rows remains consistent throughout the labware
* The overall height remains consistent throughout the labware

## Launching the Tool
First you should make sure that you run `make install` within the `/opentrons` top level folder.
If you are up-to-date on all other directories you can simply run `yarn` instead.
Next you have two options:
1. From the top level folder type: `make -C labware-designer dev`
2. Open your browser and type in: `localhost:8080`
OR
1. Type `make build` within the `opentrons/labware-designer` folder
2. Open `labware-designer/dist/index.html` in your browser

Once you have the browser page open, you should be able to go to the browser console.
* Right Click to find the `inspector` or use whichever shortcut you may have associated with this

When you are in the console, you can use the global variable `sharedData` and use any public functions
which are exported in that project.

## What function do I need to use?
The generator function is called `createRegularLabware()`. You can use it in the browser
by typing `sharedData.createRegularLabware(input)`

### What data is needed?
It takes in an `input` object of the following shape:
input = {
  metadata,
  parameters,
  offset,
  dimensions,
  grid,
  spacing,
  well,
  vendor,
}

The above inputs are all required except for `vendor`. Each individual input has the following shape(s).
Variables in bold signify that they are required, those in italics are optional.

metadata = {
  **name**: string,
  **displayCategory**: string,
  _displayVolumeUnits_: string,
  _displayLengthUnits_: string,
}
* Name is what you choose to refer to the container as (i.e.) `96-flat`
* displayCategory is what category the container type falls into. There are currently five options:
..* wellPlate
..* tuberack
..* tiprack
..* trough
..* trash

parameters = {
  **format**: string,
  **isTiprack**: boolean,
  _tipLength_: number,
}
* Format is used to determine how a multichannel pipette may (or may not) interact with this labware.
There are currently four categories
..* irregular (any type of container a multichannel cannot access -- most tuberacks, irregular labware etc)
..* 96Standard (any container in a 96 format: well plate or tiprack)
..* 384Standard (any container in a 96 format: well plate or tiprack)
..* trough

well = {
  **depth**: number,
  **shape**: string,
  _diameter_: number,
  _length_: number,
  _width_: number,
  _totalLiquidVolume_: number,
}
* depth is how deep a given well is
* shape is what type of well you are dealing with. Currently there are two options:
..* circular (if of this shape, diameter is required)
..* rectangular (if of this shape, width and length is required)

grid = {
  **row**: number,
  **column**: number,
}
* Grid is the number of rows and columns in a given labware

spacing = {
  **row**: number,
  **column**: number,
}
* Spacing is the center to center distance of wells between rows and columns

offset = {
  **x**: number,
  **y**: number,
  **z**: number,
}
* Offset is taken from the top left corner of a container to well `A1`.

## Output
The output of your data should look something to the affect of this JSON below:
```
{
  "otId": "mock-id",
  "deprecated": false,
  "metadata": {
    "name": "fake labware",
    "displayCategory": "wellPlate",
    "displayVolumeUnits": "uL",
    "displayLengthUnits": "mm"
  },
  "vendor": {
    "sku": "t40u9sernisofsea",
    "vendor": "opentrons"
  },
  "parameters": {
    "format": "96Standard",
    "isTiprack": false
  },
  "cornerOffsetFromSlot": {
    "x": 10,
    "y": 10,
    "z": 5
  },
  "dimensions": {
    "overallLength": 50,
    "overallWidth": 50,
    "overallHeight": 50
  },
  "ordering": [["A1"], ["A2"]],
  "wells": {
    "A1": {
      "depth": 40,
      "totalLiquidVolume": 100,
      "diameter": 30,
      "x": 0,
      "y": 0,
      "z": 0,
      "shape": "circular"
    },
    "A2": {
      "depth": 40,
      "totalLiquidVolume": 100,
      "diameter": 30,
      "x": 10,
      "y": 0,
      "z": 0,
      "shape": "circular"
    }
  }
}
```


To make the data easier to copy from the browser, simply use the `stringify` function.
It would look something to the effect of: `JSON.stringify(output)`
