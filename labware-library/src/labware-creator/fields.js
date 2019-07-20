// @flow

export const X_DIMENSION = 127.76
export const Y_DIMENSION = 85.48
export const XY_ALLOWED_VARIANCE = 0.25

export type LabwareType =
  | 'wellPlate'
  | 'reservoir'
  | 'tubeRack'
  | 'aluminumBlock'
export const labwareTypeOptions = [
  { name: 'Well Plate', value: 'wellPlate' },
  { name: 'Reservoir', value: 'reservoir' },
  { name: 'Tube Rack', value: 'tubeRack' },
  { name: 'Aluminum Block', value: 'aluminumBlock' },
]

export type WellShape = 'circular' | 'rectangular'
export const wellShapeOptions = [
  { name: 'Circular', value: 'circular' },
  { name: 'Rectangular', value: 'rectangular' },
]

export type WellBottomShape = 'flat' | 'round' | 'v'
export const wellBottomShapeOptions = [
  { name: 'Flat', value: 'flat' },
  { name: 'Round', value: 'round' },
  { name: 'V-Bottom', value: 'v' },
]

export type BooleanString = 'true' | 'false' // TODO IMMEDIATELY revisit

export const yesNoOptions = [
  { name: 'Yes', value: 'true' },
  { name: 'No', value: 'false' },
]

export const aluminumBlockTypes = [
  /* TODO */
] // TODO write name/value/image
export const aluminumBlockChildLabwareTypes = [
  /* TODO */
] // TODO derive from labware
export const tubeRackInsertOptions = [
  {
    name: '6 tubes',
    value: 'TODO loadName of labware def here: 6 tubes',
    image: 'TODO image URL here',
  },
  // TODO: We're punting on the 2-size 10 tube rack!
  // {
  //   name: '10 tubes (2 size)',
  //   value: 'TODO loadName of labware def here: 10 tubes (2 size)',
  //   image: 'TODO image URL here',
  // },
  {
    name: '15 tubes',
    value: 'TODO loadName of labware def here: 15 tubes',
    image: 'TODO image URL here',
  },
  {
    name: '24 tubes (snap cap)',
    value: 'TODO loadName of labware def here: 24 tubes (snap cap)',
    image: 'TODO image URL here',
  },
]

export type LabwareFields = {|
  labwareType: ?LabwareType,
  tubeRackInsertLoadName: ?string,
  aluminumBlockType: ?string, // eg, '24well' or '96well'
  aluminumBlockChildLabwareType: ?LabwareType,

  // tubeRackSides: Array<string>, // eg, []
  footprintXDimension: ?string,
  footprintYDimension: ?string,
  labwareZDimension: ?string,

  gridRows: ?string,
  gridColumns: ?string,
  gridSpacingX: ?string,
  gridSpacingY: ?string,
  gridOffsetX: ?string,
  gridOffsetY: ?string,

  heterogeneousWells: ?BooleanString,
  irregularRowSpacing: ?BooleanString,
  irregularColumnSpacing: ?BooleanString,

  wellVolume: ?string,
  wellBottomShape: ?WellBottomShape,
  wellDepth: ?string,
  wellShape: ?WellShape,

  // used with circular well shape only
  wellDiameter: ?string,

  // used with rectangular well shape only
  wellXDimension: ?string,
  wellYDimension: ?string,

  brand: ?string,
  brandId: Array<string>,

  loadName: ?string,
  displayName: ?string,
|}

// PROCESSED FIELDS

export type ProcessedLabwareTypeFields =
  | {|
      labwareType: 'aluminumBlock',
      aluminumBlockType: ?string,
      aluminumBlockChildLabwareType: LabwareType,
    |}
  | {|
      labwareType: 'tubeRack',
      tubeRackInsertLoadName: string,
      // tubeRackSides: Array<string>,
    |}
  | {|
      labwareType: 'wellPlate' | 'reservoir',
    |}

type ProcessedWellShapeFields =
  | {|
      wellShape: 'circular',
      wellDiameter: number,
    |}
  | {|
      wellShape: 'rectangular',
      wellXDimension: number,
      wellYDimension: number,
    |}

export type ProcessedLabwareCommonFields = {|
  footprintXDimension: number,
  footprintYDimension: number,
  labwareZDimension: number,

  gridRows: number,
  gridColumns: number,
  gridSpacingX: number,
  gridSpacingY: number,
  gridOffsetX: number,
  gridOffsetY: number,

  // NOTE: these fields don't *really* need to be here after processing, but might be useful down the road?
  heterogeneousWells: boolean,
  irregularRowSpacing: boolean,
  irregularColumnSpacing: boolean,

  wellVolume: number,
  wellBottomShape: WellBottomShape,
  wellDepth: number,

  brand: string,
  brandId: Array<string>,

  loadName: string,
  displayName: string,
|}

// Split up the enum cases so Flow doesn't explode
export type ProcessedLabwareFields = {|
  labwareTypeFields: ProcessedLabwareTypeFields,
  wellShapeFields: ProcessedWellShapeFields,
  commonFields: ProcessedLabwareCommonFields,
|}
