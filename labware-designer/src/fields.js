// @flow

export type LabwareType =
  | 'wellPlate'
  | 'reservoir'
  | 'tuberack'
  | 'aluminumBlock'
export const labwareTypes: Array<LabwareType> = [
  'wellPlate',
  'reservoir',
  'tuberack',
  'aluminumBlock',
]

export type WellShape = 'circular' | 'rectangular'
export const wellShapes: Array<WellShape> = ['circular', 'rectangular']

export type WellBottomShape = 'flat' | 'round' | 'v'
export const wellBottomShapes: Array<WellBottomShape> = ['flat', 'round', 'v']

export const aluminumBlockTypes = [
  /* TODO */
] // TODO derive from labware
export const aluminumBlockChildLabwareTypes = [
  /* TODO */
] // TODO derive from labware
export const tuberackInsertOptions = [
  {
    label: '6 tubes',
    value: 'TODO loadName of labware def here',
    image: 'TODO image URL here',
  },
  {
    label: '10 tubes (2 size)',
    value: 'TODO loadName of labware def here',
    image: 'TODO image URL here',
  },
  {
    label: '15 tubes',
    value: 'TODO loadName of labware def here',
    image: 'TODO image URL here',
  },
  {
    label: '24 tubes (snap cap)',
    value: 'TODO loadName of labware def here',
    image: 'TODO image URL here',
  },
]

export type LabwareFields = {|
  labwareType: ?LabwareType,
  tubeRackInsertLoadName: ?string,
  aluminumBlockType: ?string, // eg, '24well' or '96well'
  aluminumBlockChildLabwareType: ?LabwareType,

  tuberackSides: Array<string>, // eg, []
  footprintXDimension: ?number,
  footprintYDimension: ?number,
  labwareZDimension: ?number,

  gridRows: ?number,
  gridColumns: ?number,
  gridSpacingX: ?number,
  gridSpacingY: ?number,
  gridOffsetX: ?number,
  gridOffsetY: ?number,

  heterogeneousWells: ?boolean,
  irregularRowSpacing: ?boolean,
  irregularColumnSpacing: ?boolean,

  wellVolume: ?number,
  wellBottomShape: ?WellBottomShape,
  wellDepth: ?number,
  wellShape: ?WellShape,

  // used with circular well shape only
  wellDiameter: ?number,

  // used with rectangular well shape only
  wellXDimension: ?number,
  wellYDimension: ?number,

  brand: ?string,
  brandId: Array<string>,

  loadName: ?string,
  displayName: ?string,
|}
