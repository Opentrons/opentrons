# Labware Creator

This is a simple browser tool which can be used to generate labware definitions for _regular_ labware (labware that is
laid out on a grid, and where all wells have consistent dimensions), or _irregular_ labware.

### What is a 'regular' labware?

This is a geometric sense of the word "regular". A labware in which:

- grid shape is uniform (a single regular grid, where each column and each row has a consistent number of wells)
- spacing between columns and rows remains consistent throughout the labware
- the overall height remains consistent throughout the labware

### What is an 'irregular' labware?

Any labware that does not meet the criteria of 'regular'. A labware is irregular if it has:

- more than one grid defining the x-y position of wells (such as a diamond arrangement)
- differing well dimensions (depth, diameter, shape, etc)
- differing numbers of wells from row to row or column to column
- any other dimensional irregularity

## Launching the Tool

First you should make sure that you run `make install` within the `opentrons` top level folder.
If you are up-to-date on all other directories you can simply run `yarn` instead.
Next you have two options:

1. From the top level folder type: `make -C labware-designer dev`
2. Open your browser and type in: `localhost:8080`

OR

1. From the top level folder type: `make -C labware-designer`
2. Open `labware-designer/dist/index.html` in your browser

- In the browser window, open the console (in Chrome, right click in the middle of the page, select "Inspect" and then select the "Console" tab--other browsers vary but are similar).
- In the console, you can use the global variable `sharedData` and use any public functions which are exported in that project.

## Usage

The generator has the following functions:

- `sharedData.createRegularLabware` - Generate regular labware definition
- `sharedData.createIrregularLabware` - Generate irrgular labware definition

### createRegularLabware(options: RegularLabwareProps): LabwareDefinition2

To build a _regular_ labware, the `options` object should have the following shape:

| field        | type                      | required | description                                     |
| ------------ | ------------------------- | -------- | ----------------------------------------------- |
| `metadata`   | [Metadata](#Metadata)     | yes      | Information about the labware                   |
| `parameters` | [Parameters](#Parameters) | yes      | Parameters that affect labware functionality    |
| `dimensions` | [Dimensions](#Dimensions) | yes      | Overall dimensions of the labware               |
| `offset`     | [Offset](#Offset)         | yes      | Distance from slot's top-left corner to well A1 |
| `grid`       | [Grid](#Grid)             | yes      | Number of rows and columns of wells             |
| `spacing`    | [Spacing](#Spacing)       | yes      | Distance between rows and columns               |
| `well`       | [Well](#Well)             | yes      | Well parameters                                 |
| `brand`      | [Brand](#Brand)           | no       | Labware manufacturer ("generic" if omitted)     |

This example generates [generic_96_wellplate_380_ul.json][]:

```js
const options = {
  metadata: {
    displayName: 'ANSI 96 Standard Microplate',
    displayCategory: 'wellPlate',
    displayVolumeUnits: 'uL',
    displayLengthUnits: 'mm',
    tags: ['flat', 'microplate', 'SBS', 'ANSI', 'generic'],
  },
  parameters: {
    format: '96Standard',
    isTiprack: false,
    isMagneticModuleCompatible: false,
  },
  offset: {x: 14.38, y: 11.24, z: 14.35},
  dimensions: {
    overallLength: 127.76,
    overallWidth: 85.48,
    overallHeight: 14.35,
  },
  grid: {row: 8, column: 12},
  spacing: {row: 9, column: 9},
  well: {
    depth: 10.54,
    shape: 'circular',
    diameter: 6.4,
    totalLiquidVolume: 380,
  },
  brand: {brand: 'generic'},
}

const labware = sharedData.createRegularLabware(options)
```

[generic_96_wellplate_380_ul.json]: ../shared-data/definitions2/generic_96_wellplate_380_ul.json

### createIrregularLabware(options: IrregularLabwareProps): LabwareDefinition2

To build an _irregular_ labware, the `options` object should have the following shape:

| field        | type                           | required | description                                                      |
| ------------ | ------------------------------ | -------- | ---------------------------------------------------------------- |
| `metadata`   | [Metadata](#Metadata)          | yes      | Information about the labware                                    |
| `parameters` | [Parameters](#Parameters)      | yes      | Parameters that affect labware functionality                     |
| `dimensions` | [Dimensions](#Dimensions)      | yes      | Overall dimensions of the labware                                |
| `offset`     | Array<[Offset](#Offset) >      | yes      | Distances from slot's top-left corner to first well of each grid |
| `grid`       | Array<[Grid](#Grid)>           | yes      | Number of rows and columns per grid                              |
| `spacing`    | Array<[Spacing](#Spacing)>     | yes      | Distance between rows and columns per grid                       |
| `well`       | Array<[Well](#Well)>           | yes      | Well parameters per grid                                         |
| `gridStart`  | Array<[GridStart](#GridStart)> | yes      | Well naming scheme per grid                                      |
| `brand`      | [Brand](#Brand)                | no       | Labware manufacturer ("generic" if omitted)                      |

This example generates [opentrons_6x15_ml_4x50_ml_tuberack.json][]

```js
const options = {
  metadata: {
    displayName: 'Opentrons 15x50mL tube rack',
    displayCategory: 'tubeRack',
    displayVolumeUnits: 'mL',
    displayLengthUnits: 'mm',
    tags: ['opentrons', 'modular', 'tuberack', '15', 'mL', '50'],
  },
  parameters: {
    format: 'irregular',
    isTiprack: false,
    isMagneticModuleCompatible: false,
  },
  dimensions: {
    overallLength: 127.75,
    overallWidth: 85.5,
    overallHeight: 123.76,
  },
  offset: [{x: 13.88, y: 17.75, z: 123.76}, {x: 71.38, y: 25.25, z: 119.8}],
  grid: [{row: 3, column: 2}, {row: 2, column: 2}],
  spacing: [{row: 25, column: 25}, {row: 35, column: 35}],
  well: [
    {totalLiquidVolume: 15, diameter: 14.5, shape: 'circular', depth: 117.98},
    {totalLiquidVolume: 50, diameter: 26.45, shape: 'circular', depth: 113.85},
  ],
  gridStart: [
    {rowStart: 'A', colStart: 1, rowStride: 1, colStride: 1},
    {rowStart: 'A', colStart: 3, rowStride: 1, colStride: 1},
  ],
  brand: {brand: 'Opentrons', brandId: ['352096', '352070']},
}

const labware = sharedData.createIrregularLabware(options)
```

[opentrons_6x15_ml_4x50_ml_tuberack.json]: ../shared-data/definitions2/opentrons_6x15_ml_4x50_ml_tuberack.json

### Types

#### Metadata

```js
type Metadata = {
  displayName: string,
  displayCategory: string,
  displayVolumeUnits?: string,
  displayLengthUnits?: string,
  tags?: Array<string>,
}
```

"displayName" is the name of the labware in the Opentrons App, Protocol Designer, and other client apps (i.e.: "Opentrons 96 PCR plate" or similar)

"displayCategory" is what category the container type falls into. It must be one of:

- "wellPlate"
- "tubeRack"
- "tipRack"
- "trough"
- "trash"
- "other"

"tags" is a list of generic words that describe this labware such as shape of bottom, color or other important factors

#### Parameters

```js
type Parameters = {
  format: string,
  isTiprack: boolean,
  tipLength?: number, // required if "isTiprack" is true
  isMagneticModuleCompatible: boolean,
  magneticModuleEngageHeight?: number, // required if "isMagneticModuleCompatible" is true
}
```

Format is used to determine how a multichannel pipette may (or may not) interact with this labware.

There are currently four categories:

- irregular (any type of container a multichannel cannot access -- most tuberacks, irregular labware etc)
- 96Standard (any container in a 96 format: well plate or tiprack)
- 384Standard (any container in a 96 format: well plate or tiprack)
- trough

Note: The parameters schema includes a `loadName` field, but this should not be set by the user. It is generated by the program as:

```js
loadName = `${brand}_${numWells}_${displayCategory}_${totalVol}_${displayVolumeUnits}`.toLowerCase()
```

#### Well

```js
type Well = {
  depth: number,
  shape: string,
  diameter?: number,
  length?: number,
  width?: number,
  totalLiquidVolume: number,
}
```

"depth" is how deep a given well is.

"shape" is what type of well you are dealing with. Currently there are two options:

- "circular" (if of this shape, diameter is required)
- "rectangular" (if of this shape, width and length is required)

"width" corresponds to the Y axis on the deck of the OT2, and "length" corresponds to the X axis

"totalLiquidVolume" is the actual working volume of the well, in the units specified in "displayLiquidVolume" (default
is uL)

Note: The well schema includes `x`, `y`, and `z` fields, but they should not be set by the user. The generator functions will calculate well positions.

#### Grid

```js
type Grid = {
  row: number,
  column: number,
}
```

Grid is the number of rows and columns in a given labware

#### Spacing

```js
type Spacing = {
  row: number,
  column: number,
}
```

Spacing is the center to center distance of wells between rows and columns

#### Offset

```js
type Offset = {
  x: number,
  y: number,
  z: number,
}
```

Offset is taken from the **upper left corner of the labware, flush with the deck** to the top-center of well `A1`.

#### Dimensions

```js
type Dimensions = {
  overallLength: number,
  overallWidth: number,
  overallHeight: number,
}
```

"overallLength" is the outer dimension of the labware in the X axis in mm--usually equal to the length of the slot: 127.76 mm.

"overallWidth" is the outer dimension of the labware in the Y axis in mm--usually equal to the width of the slot: 85.48 mm.

"overallHeight" is the outer dimension of the labware in the Z axis in mm--usually the same as the top the well, but can be higher in case of some kind of veritcal protrusion.

#### GridStart

```js
type GridStart = {
  rowStart: string,
  colStart: string,
  rowStride: number,
  colStride: number,
}
```

GridStart is used to generate well names for irregular labware. The object represents creating a "range" of well names with step intervals included. For example, starting at well "A1" with a column stride of 2 would result in the grid names being ordered as: "A1", "B1", ...; "A3", "B3", ...; etc.

#### Brand

```js
type Brand = {
  brand: string,
  brandId?: string,
}
```

"brand" is the name of the manufacturer

"brandId" is used when a definition accurately reflects several products

If `brand` is omitted from the input, the resulting definition will have: `"brand": {"brand": "generic"}`.

## Explanation of Numerical inputs

See diagram below:

![Labware Dimension Diagram](https://user-images.githubusercontent.com/31892318/48797647-c35ffa80-ecd0-11e8-823a-e40f903a90c8.png)
