// @flow
export type WellDefinition = {
  diameter?: number, // NOTE: presence of diameter indicates a circular well
  depth?: number, // TODO Ian 2018-03-12: depth should be required, but is missing in MALDI-plate
  height: number,
  length: number,
  width: number,
  x: number,
  y: number,
  z: number,
  'total-liquid-volume': number,
}

// typedef for deprectated labware definitions
export type LabwareDefinition = {
  metadata: {
    name: string,
    format: string,
    deprecated?: boolean,
    displayName?: string,
    displayCategory?: string,
    isValidSource?: boolean,
    isTiprack?: boolean,
    tipVolume?: number,
  },
  ordering: Array<Array<string>>,
  wells: {
    [well: string]: WellDefinition,
  },
}

export type AllLabwareDefinitions = {
  [name: string]: LabwareDefinition,
}

export type LabwareDisplayCategory =
  | 'tipRack'
  | 'tubeRack'
  | 'trough'
  | 'trash'
  | 'wellPlate'
  | 'other'

export type LabwareMetadata = {|
  displayName: string,
  displayCategory: LabwareDisplayCategory,
  displayVolumeUnits: string,
  displayLengthUnits?: string,
  tags?: Array<string>,
|}

export type LabwareDimensions = {|
  overallLength: number,
  overallWidth: number,
  overallHeight: number,
|}

export type LabwareOffset = {|
  x: number,
  y: number,
  z: number,
|}

// 1. Valid pipette type for a container (i.e. is there multi channel access?)
// 2. Is the container a tiprack?
export type LabwareParameters = {|
  loadName: string,
  format: string,
  isTiprack: boolean,
  tipLength?: number,
  isMagneticModuleCompatible: boolean,
  magneticModuleEngageHeight?: number,
|}

export type LabwareBrand = {|
  brandId?: Array<string>,
  brand: string,
|}

export type LabwareWell = {|
  depth: number,
  shape: string,
  totalLiquidVolume: number,
  x: number,
  y: number,
  z: number,
  diameter?: number,
  length?: number,
  width?: number,
|}

// TODO(mc, 2019-03-18): this should eventually replace LabwareDefinition
// NOTE: must be synced with shared-data/labware-json-schema/labware-schema.json
export type LabwareDefinition2 = {|
  otId: string,
  deprecated: boolean,
  metadata: LabwareMetadata,
  dimensions: LabwareDimensions,
  cornerOffsetFromSlot: LabwareOffset,
  parameters: LabwareParameters,
  brand: LabwareBrand,
  ordering: Array<Array<string>>,
  wells: {[wellName: string]: LabwareWell},
|}
