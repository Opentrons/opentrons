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
If you are up-to-date on all other directories you can simply run `make install-js` instead.
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
- `sharedData.createIrregularLabware` - Generate irregular labware definition

**Note**: The generator will make a best-effort to generate a sane load name, but it may need to be edited manually based on specific needs.

### createRegularLabware(options: RegularLabwareProps): LabwareDefinition2

To build a _regular_ labware, the `options` object should have the following shape:

| field             | type                              | required | description                                                                                        |
| ----------------- | --------------------------------- | -------- | -------------------------------------------------------------------------------------------------- |
| `metadata`        | [Metadata](#Metadata)             | yes      | Information about the labware                                                                      |
| `parameters`      | [Parameters](#Parameters)         | yes      | Parameters that affect labware functionality                                                       |
| `dimensions`      | [Dimensions](#Dimensions)         | yes      | Overall dimensions of the labware                                                                  |
| `offset`          | [Offset](#Offset)                 | yes      | Distance from labware's top-left corner to well A1                                                 |
| `grid`            | [Grid](#Grid)                     | yes      | Number of rows and columns of wells                                                                |
| `spacing`         | [Spacing](#Spacing)               | yes      | Distance between rows and columns                                                                  |
| `well`            | [Well](#Well)                     | yes      | Well parameters                                                                                    |
| `group`           | [Group](#Group)                   | no       | Well group parameters                                                                              |
| `brand`           | [Brand](#Brand)                   | no       | Labware manufacturer ("generic" if omitted)                                                        |
| `version`         | [number](#Version)                | no       | Version of the definition, should be incremented if non-metadata info is altered (defaults to `1`) |
| `namespace`       | [string](#Namespace)              | no       | Defaults to "custom_beta"                                                                          |
| `loadNamePostfix` | [Array<string>](#LoadNamePostfix) | no       | Array of additional strings to postfix the loadName with                                           |

This example generates [corning_96_wellplate_360ul_flat][]:

```js
const options = {
  namespace: 'opentrons',
  metadata: {
    displayName: 'Corning 96 Well Plate 360 µL Flat',
    displayCategory: 'wellPlate',
    displayVolumeUnits: 'µL',
    tags: [],
  },
  loadNamePostfix: ['flat'],
  parameters: {
    format: '96Standard',
    isTiprack: false,
    isMagneticModuleCompatible: false,
  },
  offset: { x: 14.38, y: 11.23, z: 14.22 },
  dimensions: {
    xDimension: 127.76,
    yDimension: 85.47,
    zDimension: 14.22,
  },
  grid: { row: 8, column: 12 },
  spacing: { row: 9, column: 9 },
  well: {
    depth: 10.67,
    shape: 'circular',
    diameter: 6.86,
    totalLiquidVolume: 360,
  },
  group: {
    metadata: {
      wellBottomShape: 'flat',
    },
  },
  brand: {
    brand: 'Corning',
    brandId: [
      '3650',
      '3916',
      '3915',
      '3361',
      '3590',
      '9018',
      '3591',
      '9017',
      '3641',
      '3628',
      '3370',
      '2507',
      '2509',
      '2503',
      '3665',
      '3600',
      '3362',
      '3917',
      '3912',
      '3925',
      '3922',
      '3596',
      '3977',
      '3598',
      '3599',
      '3585',
      '3595',
      '3300',
      '3474',
    ],
    links: [
      'https://ecatalog.corning.com/life-sciences/b2c/US/en/Microplates/Assay-Microplates/96-Well-Microplates/Corning%C2%AE-96-well-Solid-Black-and-White-Polystyrene-Microplates/p/corning96WellSolidBlackAndWhitePolystyreneMicroplates',
    ],
  },
}

const labware = sharedData.createRegularLabware(options)
```

[corning_96_wellplate_360ul_flat]: ../shared-data/labware/definitions/2/corning_96_wellplate_360ul_flat/1.json

### createIrregularLabware(options: IrregularLabwareProps): LabwareDefinition2

To build an _irregular_ labware, the `options` object should have the following shape:

| field             | type                              | required | description                                                                                        |
| ----------------- | --------------------------------- | -------- | -------------------------------------------------------------------------------------------------- |
| `metadata`        | [Metadata](#Metadata)             | yes      | Information about the labware                                                                      |
| `parameters`      | [Parameters](#Parameters)         | yes      | Parameters that affect labware functionality                                                       |
| `dimensions`      | [Dimensions](#Dimensions)         | yes      | Overall dimensions of the labware                                                                  |
| `offset`          | Array<[Offset](#Offset)>          | yes      | Distances from labware's top-left corner to first well of each grid                                |
| `grid`            | Array<[Grid](#Grid)>              | yes      | Number of rows and columns per grid                                                                |
| `spacing`         | Array<[Spacing](#Spacing)>        | yes      | Distance between rows and columns per grid                                                         |
| `well`            | Array<[Well](#Well)>              | yes      | Well parameters per grid                                                                           |
| `gridStart`       | Array<[GridStart](#GridStart)>    | yes      | Well naming scheme per grid                                                                        |
| `group`           | Array<[Group](#Group)>            | no       | Well group parameters per grid                                                                     |
| `brand`           | [Brand](#Brand)                   | no       | Labware manufacturer information                                                                   |
| `version`         | [number](#Version)                | no       | Version of the definition, should be incremented if non-metadata info is altered (defaults to `1`) |
| `namespace`       | [string](#Namespace)              | no       | Defaults to "custom_beta"                                                                          |
| `loadNamePostfix` | [Array<string>](#LoadNamePostfix) | no       | Array of additional strings to postfix the loadName with                                           |

This example generates [opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical][]

```js
const options = {
  namespace: 'opentrons',
  metadata: {
    displayName: 'Opentrons 10 Tube Rack with Falcon 4x50 mL, 6x15 mL Conical',
    displayCategory: 'tubeRack',
    displayVolumeUnits: 'mL',
    tags: [],
  },
  parameters: {
    format: 'irregular',
    isTiprack: false,
    isMagneticModuleCompatible: false,
  },
  dimensions: {
    xDimension: 127.75,
    yDimension: 85.5,
    zDimension: 123.76,
  },
  offset: [{ x: 13.88, y: 17.75, z: 123.76 }, { x: 71.38, y: 25.25, z: 119.8 }],
  grid: [{ row: 3, column: 2 }, { row: 2, column: 2 }],
  spacing: [{ row: 25, column: 25 }, { row: 35, column: 35 }],
  well: [
    {
      totalLiquidVolume: 15000,
      diameter: 14.9,
      shape: 'circular',
      depth: 117.98,
    },
    {
      totalLiquidVolume: 50000,
      diameter: 27.81,
      shape: 'circular',
      depth: 113.85,
    },
  ],
  gridStart: [
    { rowStart: 'A', colStart: '1', rowStride: 1, colStride: 1 },
    { rowStart: 'A', colStart: '3', rowStride: 1, colStride: 1 },
  ],
  group: [
    {
      metadata: {
        displayName: 'Falcon 6x15 mL Conical',
        displayCategory: 'tubeRack',
        wellBottomShape: 'v',
      },
      brand: {
        brand: 'Falcon',
        brandId: ['352095', '352096', '352097', '352099', '352196'],
        links: [
          'https://ecatalog.corning.com/life-sciences/b2c/US/en/Liquid-Handling/Tubes,-Liquid-Handling/Centrifuge-Tubes/Falcon%C2%AE-Conical-Centrifuge-Tubes/p/falconConicalTubes',
        ],
      },
    },
    {
      metadata: {
        displayName: 'Falcon 4x50 mL Conical',
        displayCategory: 'tubeRack',
        wellBottomShape: 'v',
      },
      brand: {
        brand: 'Falcon',
        brandId: ['352070', '352098'],
        links: [
          'https://ecatalog.corning.com/life-sciences/b2c/US/en/Liquid-Handling/Tubes,-Liquid-Handling/Centrifuge-Tubes/Falcon%C2%AE-Conical-Centrifuge-Tubes/p/falconConicalTubes',
        ],
      },
    },
  ],
  brand: {
    brand: 'Opentrons',
    brandId: [],
    links: [
      'https://shop.opentrons.com/collections/opentrons-tips/products/tube-rack-set-1',
    ],
  },
}

// load name will need to be edited manually
const labware = sharedData.createIrregularLabware(options)
```

[opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical.json]: ../shared-data/labware/definitions/2/opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical/1.json

### Types

#### Metadata

Type: object

Metadata that affects how the labware is displayed to the user but does not affect labware functionality.

Example:

```js
const metadata = {
  displayName: 'ANSI 96 Standard Microplate',
  displayCategory: 'wellPlate',
  displayVolumeUnits: 'uL', // u will be converted to µ
  tags: ['flat', 'microplate', 'SBS', 'ANSI', 'generic'],
}
```

Fields:

| field              | type           | required | description                                  |
| ------------------ | -------------- | -------- | -------------------------------------------- |
| displayName        | string         | yes      | Human-readable labware name                  |
| displayCategory    | enum           | yes      | Labware category in the library (see below)  |
| displayVolumeUnits | enum           | no       | Volume units to use for display (default µL) |
| tags               | Array<string\> | no       | List of strings to use as search tags        |

- `displayName` is the name of the labware in the Opentrons App, Protocol Designer, and other client apps
- `displayCategory` must be one of:
  - `wellPlate`
  - `tubeRack`
  - `tipRack`
  - `trough`
  - `trash`
  - `other`
- `displayVolumeUnits` is the units scale to use in the labware load name and app display; defaults to `µL` and must be one of:
  - `µL`
  - `mL`
  - `L`
- `tags` is a list of generic words that a user may search for to find the labware

#### Parameters

Type: object

Parameters that affect how the labware is operated on by the robot

Example:

```js
const parameters = {
  format: '96Standard',
  isTiprack: false,
  isMagneticModuleCompatible: false,
}
```

Fields:

| field                      | type    | required | description                                                                               |
| -------------------------- | ------- | -------- | ----------------------------------------------------------------------------------------- |
| format                     | enum    | yes      | Labware format for pipette access (see below)                                             |
| isTiprack                  | boolean | yes      | Whether or not labware is a tiprack                                                       |
| tipLength                  | number  | no       | Length of tips in rack; required if `isTiprack: true`                                     |
| isMagneticModuleCompatible | boolean | yes      | Whether labware can be with the Magnetic Module                                           |
| magneticModuleEngageHeight | number  | no       | Engagement height for Magnetic Module use; required if `isMagneticModuleCompatible: true` |

- `format` is determines how a multichannel pipette may interact with the labware
  - `irregular` - any type of container a multichannel cannot access; e.g. most tuberacks, irregular labware, etc
  - `96Standard` - any labware with an 8x12 grid, well plate or tiprack
  - `384Standard` - any labware with a 16x24 grid, well plate or tiprack
  - `trough` - labware where all tips of a multichannel access a single well simultaneously
- `isTiprack` specifies that the labware is a tiprack and all wells are tips
- `tipLength` specifies the length of the tips if `isTiprack` is `true`
- `isMagneticModuleCompatible` specifies that the labware can be used on the Magnetic Module
- `magneticModuleEngageHeight` specifies the height at which the Magnetic Module should engage if `isMagneticModuleCompatible` is `true`

Note: the full schema for `labwareDefinition.parameters` also inlcudes `parameters.loadName`. This field should not be set by the user; the program will generate it automatically and insert it into the definition:

```js
loadName = `${brand}_${numWells}_${displayCategory}_${totalVol}_${displayVolumeUnits}`.toLowerCase()
```

#### Well

Type: object

Properties to apply to every well in a given grid.

Example:

```js
const well = {
  depth: 10.54,
  shape: 'circular',
  diameter: 6.4,
  totalLiquidVolume: 380,
}
```

Fields:

| field             | type   | required | description                                                               |
| ----------------- | ------ | -------- | ------------------------------------------------------------------------- |
| depth             | number | yes      | Depth of the well in **mm**                                               |
| shape             | enum   | yes      | `rectangular` or `circular`                                               |
| totalLiquidVolume | number | yes      | Volume of the well in **µL**                                              |
| diameter          | number | no       | Diameter of the well in **mm**; required if `shape: 'circular'`           |
| xDimension        | number | no       | Length (x-axis) of the well in **mm**; required if `shape: 'rectangular'` |
| yDimension        | number | no       | Width (y-axis) of the well in **mm**; required if `shape: 'rectangular'`  |

**`totalLiquidVolume` must be specified in µL**. The generator will convert the value in µL to `metadata.displayVolumeUnits` for the `loadName`.

Note: The full well schema includes `x`, `y`, and `z` fields, but they should not be set by the user. The generator functions will calculate well positions.

#### Grid

Type: object

The number of rows and columns in a regular labware or irregular labware grid

Example:

```js
const grid = {
  row: 8,
  column: 12,
}
```

Fields:

| field  | type   | required | description                                 |
| ------ | ------ | -------- | ------------------------------------------- |
| row    | number | yes      | Number of rows (running down the y-axis)    |
| column | number | yes      | Number of columns (running down the x-axis) |

#### Spacing

Type: object

Center-to-center distance in **mm** between rows and columns in a regular labware or irregular labware grid

Example:

```js
const spacing = {
  row: 9,
  column: 9,
}
```

Fields:

| field  | type   | required | description                                         |
| ------ | ------ | -------- | --------------------------------------------------- |
| row    | number | yes      | Center-to-center distance in **mm** between rows    |
| column | number | yes      | Center-to-center distance in **mm** between columns |

#### Offset

Type: object

The distance in **mm** from the **upper left corner of the labware, flush with the deck** to the **top-center of well `A1`** (or the first well in an irregular labware grid).

Example:

```js
const offset = {
  x: 14.38,
  y: 11.24,
  z: 14.35,
}
```

Fields:

| field | type   | required | description                                  |
| ----- | ------ | -------- | -------------------------------------------- |
| x     | number | yes      | X-axis distance to well top-center in **mm** |
| y     | number | yes      | Y-axis distance to well top-center in **mm** |
| z     | number | yes      | Z-axis distance to well top-center in **mm** |

#### Dimensions

Type: object

Overall dimensions in **mm** of the labware

Example:

```js
const dimensions = {
  xDimension: 127.76,
  yDimension: 85.48,
  zDimension: 14.35,
}
```

Fields:

| field      | type   | required | description                  |
| ---------- | ------ | -------- | ---------------------------- |
| xDimension | number | yes      | X-axis measurement in **mm** |
| yDimension | number | yes      | Y-axis measurement in **mm** |
| zDimension | number | yes      | Z-axis measurement in **mm** |

- `xDimension` is the outer dimension of the labware in the X-axis
  - Usually equal to the length of the slot (127.76 mm)
- `yDimension` is the outer dimension of the labware in the Y-axis
  - Usually equal to the width of the slot (85.48 mm)
- `zDimension` is the outer dimension of the labware in the Z-axis
  - Usually the same as the top the well
  - Can be higher in case of some kind of vertical protrusion.

#### GridStart

Type: object

Used to generate well names for irregular labware. The object represents creating a "range" of well names with step intervals included. For example, starting at well "A1" with a column stride of 2 would result in the grid names being ordered as: "A1", "B1", ...; "A3", "B3", ...; etc.

Example:

```js
// if grid has 3 rows and 3 columns, will produce the following well names:
//   B2  B4  B6
//   C2  C4  C6
//   D2  D4  D6
const gridStart = {
  rowStart: 'B',
  colStart: '2',
  rowStride: 1,
  colStride: 2,
}
```

Fields:

| field     | type   | required | description                                           |
| --------- | ------ | -------- | ----------------------------------------------------- |
| rowStart  | string | yes      | Row name to start the grid at                         |
| colStart  | string | yes      | Column name to start the grid at                      |
| rowStride | number | yes      | How much to increment the row name when it rolls over |
| colStride | number | yes      | How much to increment the column when it rolls over   |

#### Group

Type: object

Each grid will be placed into a corresponding well group in the labware definition. A well group is a collection of wells that share certain properties (at the moment, just metadata).

Fields:

| field    | type                            | required | description                                           |
| -------- | ------------------------------- | -------- | ----------------------------------------------------- |
| metadata | [GroupMetadata](#GroupMetadata) | yes      | Well group metadata                                   |
| brand    | [Brand](#Brand)                 | no       | Well group brand information (e.g. tube manufacturer) |

#### GroupMetadata

Type: object

Display metadata for a given well group

Fields:

| field           | type             | required | description                                                              |
| --------------- | ---------------- | -------- | ------------------------------------------------------------------------ |
| displayName     | string           | no       | Display name of the group                                                |
| displayCategory | string           | no       | Category of the group, which may differ from the category of the labware |
| wellBottomShape | enum: flat, u, v | no       | Shape that best describes the bottom shape of the wells in the group     |

**Note**: `groups[].metadata.displayCategory` may differ from the `metadata.displayCategory` of the overall labware in certain cases. For example, the aluminum block definitions have a category of `aluminumBlock`, but their well groups have categories of `tubeRack` or `wellPlate` depending on if there are tubes or a well plate inserted into the block, respectively.

#### Brand

Type: object

Brand information for the labware or well group

Example:

```js
const brand = {
  brand: 'Opentrons',
  brandId: ['352096', '352070'],
}
```

Fields:

| field   | type           | required | description                        |
| ------- | -------------- | -------- | ---------------------------------- |
| brand   | string         | yes      | Manufacturer/brand name            |
| brandId | Array<string/> | no       | Matching product IDs               |
| links   | Array<string/> | no       | Link(s) to manufacturer webpage(s) |

If a `brand` object not input, the resulting definition will have: `"brand": {"brand": "generic"}`.

#### Namespace

Type: string

Labware definitions are placed under namespaces on a robot. All Opentrons definitions are namespaced under `"opentrons"`. Custom user-created labware definitions should be namespaced under `"custom_beta"`. Custom labware is in beta. You may lose your calibration data in a future release.

#### Version

Type: number

Version is an incrementing integer, starting at 1. Multiple versions of a labware definition can be uploaded to a robot together. When updating a definition, you should increment the version. Exception: if you only change metadata and nothing else, you do not need to update the version.

#### LoadNamePostfix

Type: Array<string\>

You may use the `loadNamePostfix` array to append additional, underscore separated strings to the load name. For example...

```js
const options = {
  // ...
  loadNamePostfix: ['flat'],
}
```

...would result in the load name: `${originalGeneratedLoadName}_flat`

## Explanation of Numerical inputs

See diagram below:

![Labware Dimension Diagram](https://user-images.githubusercontent.com/31892318/48797647-c35ffa80-ecd0-11e8-823a-e40f903a90c8.png)
