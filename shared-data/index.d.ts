// Temporary defs until shared-data is actually converted

// TODO(IL, 2021-03-24): I'm any-typing some of these where there are several
// other types involved (eg RegularNameProps),
// when we actually convert shared-data we can get rid of the any's

export function createRegularLabware(args: any): LabwareDefinition2

export const LABWAREV2_DO_NOT_LIST: string[]

export function getDisplayVolume(
  volumeInMicroliters: number,
  displayUnits?: LabwareVolumeUnits,
  digits?: number
): string
export function getLabwareDefURI(def: LabwareDefinition2): string

export function createRegularLoadName(args: any): string
export function createDefaultDisplayName(args: any): string

export const SLOT_LENGTH_MM: number
export const SLOT_WIDTH_MM: number

// TODO Ian 2019-06-04 split this out into eg ../labware/flowTypes/labwareV1.js
export interface WellDefinition {
  diameter?: number // NOTE: presence of diameter indicates a circular well
  depth?: number // TODO Ian 2018-03-12: depth should be required, but is missing in MALDI-plate
  height: number
  length: number
  width: number
  x: number
  y: number
  z: number
  'total-liquid-volume': number
}

// typedef for labware definitions under v1 labware schema
export interface LabwareDefinition1 {
  metadata: {
    name: string
    format: string
    deprecated?: boolean
    displayName?: string
    displayCategory?: string
    isValidSource?: boolean
    isTiprack?: boolean
    tipVolume?: number
  }
  ordering: Array<string[]>
  wells: {
    [well: string]: WellDefinition
  }
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

export interface LabwareMetadata {
  displayName: string
  displayCategory: LabwareDisplayCategory
  displayVolumeUnits: LabwareVolumeUnits
  tags?: string[]
}

export interface LabwareDimensions {
  xDimension: number
  yDimension: number
  zDimension: number
}

export interface LabwareOffset {
  x: number
  y: number
  z: number
}

// 1. Valid pipette type for a container (i.e. is there multi channel access?)
// 2. Is the container a tiprack?
export interface LabwareParameters {
  loadName: string
  format: string
  isTiprack: boolean
  tipLength?: number
  isMagneticModuleCompatible: boolean
  magneticModuleEngageHeight?: number
  quirks?: string[]
}

export interface LabwareBrand {
  brand: string
  brandId?: string[]
  links?: string[]
}

export type LabwareWellShapeProperties =
  | {
      shape: 'circular'
      diameter: number
    }
  | {
      shape: 'rectangular'
      xDimension: number
      yDimension: number
    }

// well without x,y,z
export type LabwareWellProperties = LabwareWellShapeProperties & {
  depth: number
  totalLiquidVolume: number
}

export type LabwareWell = LabwareWellProperties & {
  x: number
  y: number
  z: number
}

// TODO(mc, 2019-03-21): exact object is tough to use with the initial value in
// reduce, so leaving this inexact (e.g. `const a: {||} = {}` errors)
export type LabwareWellMap = {
  [wellName: string]: LabwareWell
}

export interface LabwareWellGroupMetadata {
  displayName?: string
  displayCategory?: LabwareDisplayCategory
  wellBottomShape?: WellBottomShape
}

export interface LabwareWellGroup {
  wells: string[]
  metadata: LabwareWellGroupMetadata
  brand?: LabwareBrand
}

// NOTE: must be synced with shared-data/labware/schemas/2.json
export interface LabwareDefinition2 {
  version: number
  schemaVersion: 2
  namespace: string
  metadata: LabwareMetadata
  dimensions: LabwareDimensions
  cornerOffsetFromSlot: LabwareOffset
  parameters: LabwareParameters
  brand: LabwareBrand
  ordering: Array<string[]>
  wells: LabwareWellMap
  groups: Array<LabwareWellGroup>
}

// from constants.js =====
export const THERMOCYCLER = 'thermocycler'
export const TEMPDECK = 'tempdeck'
export const MAGDECK = 'magdeck'
// these are the Module Def Schema v2 equivalents of the above. They should match the names of JSON definitions
// in shared-data/module/definitions/2.
export const MAGNETIC_MODULE_V1 = 'magneticModuleV1'
export const MAGNETIC_MODULE_V2 = 'magneticModuleV2'
export const TEMPERATURE_MODULE_V1 = 'temperatureModuleV1'
export const TEMPERATURE_MODULE_V2 = 'temperatureModuleV2'
export const THERMOCYCLER_MODULE_V1 = 'thermocyclerModuleV1'

// pipette display categories
export const GEN2 = 'GEN2'
export const GEN1 = 'GEN1'

// NOTE: these are NOT module MODELs, they are `moduleType`s. Should match ENUM in module definition file.
export const TEMPERATURE_MODULE_TYPE = 'temperatureModuleType'
export const MAGNETIC_MODULE_TYPE = 'magneticModuleType'
export const THERMOCYCLER_MODULE_TYPE = 'thermocyclerModuleType'

// ======

// Module Type corresponds to `moduleType` key in a module definition. Is NOT model.
// TODO: IL 2020-02-20 ModuleType is DEPRECATED. Replace all instances with ModuleRealType
// (then finally rename ModuleRealType -> ModuleType)
export type ModuleType = typeof MAGDECK | typeof TEMPDECK | typeof THERMOCYCLER
export type ModuleRealType =
  | typeof MAGNETIC_MODULE_TYPE
  | typeof TEMPERATURE_MODULE_TYPE
  | typeof THERMOCYCLER_MODULE_TYPE

// ModuleModel corresponds to top-level keys in shared-data/module/definitions/2

export type MagneticModuleModel =
  | typeof MAGNETIC_MODULE_V1
  | typeof MAGNETIC_MODULE_V2
export type TemperatureModuleModel =
  | typeof TEMPERATURE_MODULE_V1
  | typeof TEMPERATURE_MODULE_V2
export type ThermocyclerModuleModel = typeof THERMOCYCLER_MODULE_V1

export type ModuleModel =
  | MagneticModuleModel
  | TemperatureModuleModel
  | ThermocyclerModuleModel

export type ModuleModelWithLegacy =
  | ModuleModel
  | typeof THERMOCYCLER
  | typeof MAGDECK
  | typeof TEMPDECK

export interface DeckOffset {
  x: number
  y: number
  z: number
}

export interface Dimensions {
  xDimension: number
  yDimension: number
  zDimension: number
}

export interface DeckRobot {
  model: string
}

export interface DeckFixture {
  id: string
  slot: string
  labware: string
  displayName: string
}

export type CoordinateTuple = [number, number, number]

export type UnitDirection = 1 | -1
export type UnitVectorTuple = [UnitDirection, UnitDirection, UnitDirection]

export type DeckSlotId = string

export interface DeckSlot {
  id: DeckSlotId
  position: CoordinateTuple
  matingSurfaceUnitVector?: UnitVectorTuple
  boundingBox: Dimensions
  displayName: string
  compatibleModules: Array<ModuleType>
}

export interface DeckCalibrationPoint {
  id: string
  position: CoordinateTuple
  displayName: string
}

export interface DeckLocations {
  orderedSlots: Array<DeckSlot>
  calibrationPoints: Array<DeckCalibrationPoint>
  fixtures: Array<DeckFixture>
}

export interface DeckMetadata {
  displayName: string
  tags: string[]
}

export interface DeckLayerFeature {
  footprint: string
}

export type DeckLayer = Array<DeckLayerFeature>

export interface DeckDefinition {
  otId: string
  cornerOffsetFromOrigin: CoordinateTuple
  dimensions: CoordinateTuple
  robot: DeckRobot
  locations: DeckLocations
  metadata: DeckMetadata
  layers: Record<string, DeckLayer>
}

export interface ModuleDimensions {
  bareOverallHeight: number
  overLabwareHeight: number
  lidHeight: number
}

export interface ModuleCalibrationPoint {
  x: number
  y: number
  z?: number
}

export interface ModuleDefinition {
  labwareOffset: LabwareOffset
  dimensions: ModuleDimensions
  calibrationPoint: ModuleCalibrationPoint
  displayName: string
  loadName: string
  quirks: string[]
}

export type PipetteChannels = 1 | 8

export type PipetteDisplayCategory = typeof GEN1 | typeof GEN2

export interface FlowRateSpec {
  value: number
  min: number
  max: number
}

export interface PipetteNameSpecs {
  name: string
  displayName: string
  displayCategory: PipetteDisplayCategory
  minVolume: number
  maxVolume: number
  channels: PipetteChannels
  defaultAspirateFlowRate: FlowRateSpec
  defaultDispenseFlowRate: FlowRateSpec
  defaultBlowOutFlowRate: FlowRateSpec
  defaultTipracks: string[]
  smoothieConfigs?: {
    stepsPerMM: number
    homePosition: number
    travelDistance: number
  }
}

// TODO(mc, 2019-10-14): update this type according to the schema
export interface PipetteModelSpecs extends PipetteNameSpecs {
  model: string
  backCompatNames?: string[]
  tipLength: { value: number }
}
