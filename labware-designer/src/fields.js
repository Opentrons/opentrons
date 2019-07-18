// @flow

export type LabwareType =
  | 'wellPlate'
  | 'reservoir'
  | 'tuberack'
  | 'aluminumBlock'
export const labwareTypeOptions: Array<{ name: string, value: LabwareType }> = [
  { name: 'Well Plate', value: 'wellPlate' },
  { name: 'Reservoir', value: 'reservoir' },
  { name: 'Tube Rack', value: 'tuberack' },
  { name: 'Aluminum Block', value: 'aluminumBlock' },
]

export type WellShape = 'circular' | 'rectangular'
export const wellShapeOptions: Array<{ name: string, value: WellShape }> = [
  { name: 'Circular', value: 'circular' },
  { name: 'Rectangular', value: 'rectangular' },
]

export type WellBottomShape = 'flat' | 'round' | 'v'
export const wellBottomShapeOptions: Array<{
  name: string,
  value: WellBottomShape,
}> = [
  { name: 'Flat', value: 'flat' },
  { name: 'Round', value: 'round' },
  { name: 'V-Bottom', value: 'v' },
]

export const yesNoOptions: Array<{ name: string, value: 'true' | 'false' }> = [
  { name: 'Yes', value: 'true' },
  { name: 'No', value: 'false' },
]

export const aluminumBlockTypes = [
  /* TODO */
] // TODO derive from labware
export const aluminumBlockChildLabwareTypes = [
  /* TODO */
] // TODO derive from labware
export const tuberackInsertOptions = [
  {
    name: '6 tubes',
    value: 'TODO loadName of labware def here: 6 tubes',
    image: 'TODO image URL here',
  },
  {
    name: '10 tubes (2 size)',
    value: 'TODO loadName of labware def here: 10 tubes (2 size)',
    image: 'TODO image URL here',
  },
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
