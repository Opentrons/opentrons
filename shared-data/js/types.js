// @flow
import typeof { MAGDECK, TEMPDECK, THERMOCYCLER } from './constants'
// TODO Ian 2019-06-04 split this out into eg ../labware/flowTypes/labwareV1.js
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

// typedef for labware definitions under v1 labware schema
export type LabwareDefinition1 = {
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

// TODO(mc, 2019-05-29): Remove this enum in favor of string + exported
// constants + unit tests to catch typos in our definitions. Make changes
// here and in shared-data/labware/schemas/2.json
export type LabwareDisplayCategory =
  | 'wellPlate'
  | 'tipRack'
  | 'tubeRack'
  | 'reservoir'
  | 'aluminumBlock'
  | 'trash'
  | 'other'

export type LabwareVolumeUnits = 'µL' | 'mL' | 'L'

// TODO(mc, 2019-05-29): Remove this enum in favor of string + exported
// constants + unit tests to catch typos in our definitions. Make changes
// here and in shared-data/labware/schemas/2.json
export type WellBottomShape = 'flat' | 'u' | 'v'

export type LabwareMetadata = {|
  displayName: string,
  displayCategory: LabwareDisplayCategory,
  displayVolumeUnits: LabwareVolumeUnits,
  tags?: Array<string>,
|}

export type LabwareDimensions = {|
  xDimension: number,
  yDimension: number,
  zDimension: number,
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
  quirks?: Array<string>,
|}

export type LabwareBrand = {|
  brand: string,
  brandId?: Array<string>,
  links?: Array<string>,
|}

export type LabwareWellShapeProperties =
  | {|
      shape: 'circular',
      diameter: number,
    |}
  | {|
      shape: 'rectangular',
      xDimension: number,
      yDimension: number,
    |}

// well without x,y,z
export type LabwareWellProperties = {|
  ...LabwareWellShapeProperties,
  depth: number,
  totalLiquidVolume: number,
|}

export type LabwareWell = {|
  ...LabwareWellProperties,
  x: number,
  y: number,
  z: number,
|}

// TODO(mc, 2019-03-21): exact object is tough to use with the initial value in
// reduce, so leaving this inexact (e.g. `const a: {||} = {}` errors)
export type LabwareWellMap = {
  [wellName: string]: LabwareWell,
}

export type LabwareWellGroupMetadata = {|
  displayName?: string,
  displayCategory?: LabwareDisplayCategory,
  wellBottomShape?: WellBottomShape,
|}

export type LabwareWellGroup = {|
  wells: Array<string>,
  metadata: LabwareWellGroupMetadata,
  brand?: LabwareBrand,
|}

// NOTE: must be synced with shared-data/labware/schemas/2.json
export type LabwareDefinition2 = {|
  version: number,
  schemaVersion: 2,
  namespace: string,
  metadata: LabwareMetadata,
  dimensions: LabwareDimensions,
  cornerOffsetFromSlot: LabwareOffset,
  parameters: LabwareParameters,
  brand: LabwareBrand,
  ordering: Array<Array<string>>,
  wells: LabwareWellMap,
  groups: Array<LabwareWellGroup>,
|}

export type ModuleType = MAGDECK | TEMPDECK | THERMOCYCLER

export type DeckOffset = {|
  x: number,
  y: number,
  z: number,
|}

export type Dimensions = {|
  xDimension: number,
  yDimension: number,
  zDimension: number,
|}

export type DeckRobot = {|
  model: string,
|}

export type DeckFixture = {|
  id: string,
  slot: string,
  labware: string,
  displayName: string,
|}

export type CoordinateTuple = [number, number, number]

export type UnitDirection = 1 | -1
export type UnitVectorTuple = [UnitDirection, UnitDirection, UnitDirection]

export type DeckSlotId = string

export type DeckSlot = {|
  id: DeckSlotId,
  position: CoordinateTuple,
  matingSurfaceUnitVector?: UnitVectorTuple,
  boundingBox: Dimensions,
  displayName: string,
  compatibleModules: Array<ModuleType>,
|}
export type DeckCalibrationPoint = {|
  id: string,
  position: CoordinateTuple,
  displayName: string,
|}
export type DeckLocations = {|
  orderedSlots: Array<DeckSlot>,
  calibrationPoints: Array<DeckCalibrationPoint>,
  fixtures: Array<DeckFixture>,
|}

export type DeckMetadata = {|
  displayName: string,
  tags: Array<string>,
|}

export type DeckLayerFeature = {|
  footprint: string,
|}

export type DeckLayer = Array<DeckLayerFeature>

export type DeckDefinition = {|
  otId: string,
  cornerOffsetFromOrigin: CoordinateTuple,
  dimensions: CoordinateTuple,
  robot: DeckRobot,
  locations: DeckLocations,
  metadata: DeckMetadata,
  layers: { [string]: DeckLayer },
|}

export type ModuleDimensions = {|
  bareOverallHeight: number,
  overLabwareHeight: number,
  lidHeight: number,
|}

export type ModuleCalibrationPoint = {|
  x: number,
  y: number,
  z?: number,
|}

export type ModuleDefinition = {|
  labwareOffset: LabwareOffset,
  dimensions: ModuleDimensions,
  calibrationPoint: ModuleCalibrationPoint,
  displayName: string,
  loadName: string,
  quirks: Array<string>,
|}

export type PipetteChannels = 1 | 8

export type PipetteDisplayCategory = 'GEN1' | 'GEN2'

export type FlowRateSpec = {|
  value: number,
  min: number,
  max: number,
|}

export type PipetteNameSpecs = {|
  name: string,
  displayName: string,
  displayCategory: PipetteDisplayCategory,
  minVolume: number,
  maxVolume: number,
  channels: PipetteChannels,
  defaultAspirateFlowRate: FlowRateSpec,
  defaultDispenseFlowRate: FlowRateSpec,
  defaultBlowOutFlowRate: FlowRateSpec,
  smoothieConfigs?: {|
    stepsPerMM: number,
    homePosition: number,
    travelDistance: number,
  |},
|}

// TODO(mc, 2019-10-14): update this type according to the schema
export type PipetteModelSpecs = {
  ...PipetteNameSpecs,
  model: string,
  backCompatNames?: Array<string>,
  tipLength: { value: number },
}
