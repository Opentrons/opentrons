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

export const aluminumBlockTypeOptions = [
  {
    name: '96 well',
    value: '96well',
    image: 'TODO image URL here',
  },
  {
    name: '24 well',
    value: '24well',
    image: 'TODO image URL here',
  },
  {
    name: 'Flat - not available',
    value: 'flat',
    image: 'TODO image URL here',
    disabled: true,
  },
]

export const aluminumBlockChildTypeOptions = [
  {
    name: 'Tubes',
    value: 'tubes',
    image: 'TODO image URL here',
  },
  {
    name: 'PCR + Tube Strip',
    value: 'pcrAndTubeStrip',
    image: 'TODO image URL here',
  },
  {
    name: 'PCR Plate',
    value: 'pcrPlate',
    image: 'TODO image URL here',
  },
]

export type LabwareFields = {|
  labwareType: ?LabwareType,
  tubeRackInsertLoadName: ?string,
  aluminumBlockType: ?string, // eg, '24well' or '96well'
  aluminumBlockChildType: ?string,

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

// NOTE: these fields & types should be kept in sync with Yup schema `labwareFormSchema`.
// Also, this type def is simplified -- IRL, wellDiameter is only a number when wellShape === 'circular', and void otherwise.
// These could be represented by some complex union types, but that wouldn't really get us anywhere.
// Yup and not Flow is the authority on making sure the data is correct here.
export type ProcessedLabwareFields = {|
  labwareType: LabwareType,
  tubeRackInsertLoadName: string,
  aluminumBlockType: string,
  aluminumBlockChildType: string,

  // tubeRackSides: Array<string>, // eg, []
  footprintXDimension: number,
  footprintYDimension: number,
  labwareZDimension: number,

  gridRows: number,
  gridColumns: number,
  gridSpacingX: number,
  gridSpacingY: number,
  gridOffsetX: number,
  gridOffsetY: number,

  heterogeneousWells: BooleanString,
  irregularRowSpacing: BooleanString,
  irregularColumnSpacing: BooleanString,

  wellVolume: number,
  wellBottomShape: WellBottomShape,
  wellDepth: number,
  wellShape: WellShape,

  // used with circular well shape only
  wellDiameter: number,

  // used with rectangular well shape only
  wellXDimension: number,
  wellYDimension: number,

  brand: string,
  brandId: Array<string>,

  loadName: string,
  displayName: string,
|}

export const tubeRackInsertOptions = [
  {
    name: '6 tubes',
    value: '6tubes',
    image: require('./images/6x50mL_insert_large.png'),
  },
  {
    name: '15 tubes',
    value: '15tubes',
    image: require('./images/15x15mL_insert_large.png'),
  },
  {
    name: '24 tubes (snap cap)',
    value: '24tubesSnapCap',
    image: require('./images/24x1_5mL_insert_large.png'),
  },
  {
    name: '10 tubes (2 size)',
    value: '10tubes',
    image: require('./images/6x15mL_and_4x50mL_insert_large.png'),
    disabled: true, // 6 + 4 tube rack not yet supported
  },
]

// fields that get auto-filled when tubeRackInsertLoadName is selected
// NOTE: these are duplicate data derived from tube rack defs, but
// are intentionally duplicated to be the source of truth about the
// *tube rack inserts* (as opposed to defs that use the insert)
// TODO IMMEDIATELY: should diameter be included here too?
export const tubeRackAutofills: {
  [tubeRackInsertLoadName: string]: $Shape<LabwareFields>,
} = {
  '6tubes': {
    // NOTE: based on opentrons_6_tuberack_falcon_50ml_conical
    footprintXDimension: '127.76',
    footprintYDimension: '85.48',
    gridRows: '2',
    gridColumns: '3',
    gridSpacingX: '35.0',
    gridSpacingY: '35.0',
    gridOffsetX: '35.50',
    gridOffsetY: '25.24',
  },
  '24tubesSnapCap': {
    // NOTE: based on opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap
    footprintXDimension: '127.75',
    footprintYDimension: '85.50',
    gridRows: '4',
    gridColumns: '6',
    gridSpacingX: '19.89',
    gridSpacingY: '19.28',
    gridOffsetX: '18.21',
    gridOffsetY: '10.07',
  },
  '15tubes': {
    // NOTE: based on opentrons_15_tuberack_falcon_15ml_conical
    footprintXDimension: '127.76',
    footprintYDimension: '85.48',
    gridRows: '3',
    gridColumns: '5',
    gridSpacingX: '25.00',
    gridSpacingY: '25.00',
    gridOffsetX: '13.88',
    gridOffsetY: '17.74',
  },
}
