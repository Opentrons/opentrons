// @flow

export const X_DIMENSION = 127.76
export const Y_DIMENSION = 85.48
export const XY_ALLOWED_VARIANCE = 0.25

export type Options = Array<{|
  name: string,
  value: string,
  disabled?: boolean,
  imgSrc?: string,
|}>

export type LabwareType =
  | 'wellPlate'
  | 'reservoir'
  | 'tubeRack'
  | 'aluminumBlock'
export const labwareTypeOptions: Options = [
  { name: 'Well Plate', value: 'wellPlate' },
  { name: 'Reservoir', value: 'reservoir' },
  { name: 'Tube Rack', value: 'tubeRack' },
  { name: 'Aluminum Block', value: 'aluminumBlock' },
]

export type WellShape = 'circular' | 'rectangular'
export const wellShapeOptions: Options = [
  { name: 'Circular', value: 'circular' },
  { name: 'Rectangular', value: 'rectangular' },
]

export type WellBottomShape = 'flat' | 'round' | 'v'
export const wellBottomShapeOptions: Options = [
  { name: 'Flat', value: 'flat' },
  { name: 'Round', value: 'round' },
  { name: 'V-Bottom', value: 'v' },
]

export type BooleanString = 'true' | 'false' // TODO IMMEDIATELY revisit

export const yesNoOptions = [
  { name: 'Yes', value: 'true' },
  { name: 'No', value: 'false' },
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

export const tubeRackInsertOptions: Options = [
  {
    name: '6 tubes',
    value: '6tubes',
    imgSrc: require('./images/6x50mL_insert_large.png'),
  },
  {
    name: '15 tubes',
    value: '15tubes',
    imgSrc: require('./images/15x15mL_insert_large.png'),
  },
  {
    name: '24 tubes (snap cap)',
    value: '24tubesSnapCap',
    imgSrc: require('./images/24x1_5mL_insert_large.png'),
  },
  {
    name: '10 tubes (2 size)',
    value: '10tubes',
    imgSrc: require('./images/6x15mL_and_4x50mL_insert_large.png'),
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

// NOTE: these images are from labware-library, not labware creator's local images dir
export const aluminumBlockTypeOptions: Options = [
  {
    name: '96 well',
    value: '96well',
    imgSrc: require('../images/opentrons_96_aluminumblock_side_view.jpg'),
  },
  {
    name: '24 well',
    value: '24well',
    imgSrc: require('../images/opentrons_24_aluminumblock_side_view.jpg'),
  },
  {
    name: 'Flat - not available',
    value: 'flat',
    imgSrc: require('../images/opentrons_flat_aluminumblock_side_view.jpg'),
    disabled: true,
  },
]

export const aluminumBlockChildTypeOptions: Options = [
  {
    name: 'Tubes',
    value: 'tubes',
  },
  {
    name: 'PCR Tube Strip',
    value: 'pcrTubeStrip',
  },
  {
    name: 'PCR Plate',
    value: 'pcrPlate',
  },
]

export const aluminumBlockAutofills = {
  tubes: {
    // NOTE: based on opentrons_24_aluminumblock_generic_2ml_screwcap
    footprintXDimension: '127.75',
    footprintYDimension: '85.50',
    gridRows: '4',
    gridColumns: '6',
    gridSpacingX: '17.25',
    gridSpacingY: '17.25',
    gridOffsetX: '20.75',
    gridOffsetY: '16.87',
  },
  pcrTubeStrip: {
    // NOTE: based on opentrons_96_aluminumblock_generic_pcr_strip_200ul
    footprintXDimension: '127.75',
    footprintYDimension: '85.50',
    gridRows: '8',
    gridColumns: '12',
    gridSpacingX: '9.00',
    gridSpacingY: '9.00',
    gridOffsetX: '14.38',
    gridOffsetY: '11.25',
  },
  pcrPlate: {
    // NOTE: based on opentrons_96_aluminumblock_biorad_wellplate_200ul
    footprintXDimension: '127.75',
    footprintYDimension: '85.50',
    gridRows: '8',
    gridColumns: '12',
    gridSpacingX: '9.00',
    gridSpacingY: '9.00',
    gridOffsetX: '14.38',
    gridOffsetY: '11.24',
  },
}

export const getDefaultFormState = (): LabwareFields => ({
  labwareType: null,
  tubeRackInsertLoadName: null,
  aluminumBlockType: null,
  aluminumBlockChildType: null,

  // tubeRackSides: [],
  footprintXDimension: null,
  footprintYDimension: null,
  labwareZDimension: null,

  gridRows: null,
  gridColumns: null,
  gridSpacingX: null,
  gridSpacingY: null,
  gridOffsetX: null,
  gridOffsetY: null,

  heterogeneousWells: null,
  irregularRowSpacing: null,
  irregularColumnSpacing: null,

  wellVolume: null,
  wellBottomShape: null,
  wellDepth: null,
  wellShape: null,

  // used with circular well shape only
  wellDiameter: null,

  // used with rectangular well shape only
  wellXDimension: null,
  wellYDimension: null,

  brand: null,
  brandId: [],

  loadName: null,
  displayName: null,
})

export const LABELS: { [$Keys<LabwareFields>]: string } = {
  labwareType: 'What type of labware are you creating?',
  tubeRackInsertLoadName: 'Which tube rack insert?',
  aluminumBlockType: 'Which aluminum block?',
  aluminumBlockChildType: 'What labware is on top of your aluminum block?',
  heterogeneousWells: 'Are all your wells the same shape and size?',
  footprintXDimension: 'Length',
  footprintYDimension: 'Width',
  labwareZDimension: 'Height',
  gridRows: 'Number of rows',
  gridColumns: 'Number of columns',
  irregularRowSpacing: 'Are all of your rows evenly spaced?',
  irregularColumnSpacing: 'Are all of your columns evenly spaced?',
  wellVolume: 'Max volume per well',
  wellShape: 'Well shape',
  wellDiameter: 'Diameter',
  wellXDimension: 'Well X',
  wellYDimension: 'Well Y',
  wellBottomShape: 'Bottom shape',
  wellDepth: 'Depth',
  gridSpacingX: 'X Spacing (Xs)',
  gridSpacingY: 'Y Spacing (Ys)',
  gridOffsetX: 'X Offset (Xo)',
  gridOffsetY: 'Y Offset (Yo)',
  brand: 'Brand',
  displayName: "Display Name ('File name' ??? TODO)",
  loadName: 'API Load Name',
}
