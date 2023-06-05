import {
  MAGDECK,
  TEMPDECK,
  THERMOCYCLER,
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V2,
  TEMPERATURE_MODULE_V1,
  TEMPERATURE_MODULE_V2,
  THERMOCYCLER_MODULE_V1,
  THERMOCYCLER_MODULE_V2,
  HEATERSHAKER_MODULE_V1,
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_BLOCK_TYPE,
  GEN1,
  GEN2,
  GEN3,
  LEFT,
  RIGHT,
  GRIPPER_V1,
  GRIPPER_V1_1,
  MAGNETIC_BLOCK_V1,
} from './constants'
import type { INode } from 'svgson'
import type { RunTimeCommand } from '../protocol'
import type { PipetteName } from './pipettes'
import { LabwareLocation } from '../protocol/types/schemaV6/command/setup'

export type RobotType = 'OT-2 Standard' | 'OT-3 Standard'

export interface RobotDefinition {
  displayName: string
  robotType: RobotType
  models: string[]
}

// TODO Ian 2019-06-04 split this out into eg ../labware/flowTypes/labwareV1.js
export interface WellDefinition {
  diameter?: number
  // NOTE: presence of diameter indicates a circular well
  depth?: number
  // TODO Ian 2018-03-12: depth should be required, but is missing in MALDI-plate
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
  ordering: string[][]
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

export interface Coordinates {
  x: number
  y: number
  z: number
}
export type LabwareOffset = Coordinates

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
export type LabwareWellMap = Record<string, LabwareWell>

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
  ordering: string[][]
  wells: LabwareWellMap
  groups: LabwareWellGroup[]
}

export type ModuleType =
  | typeof MAGNETIC_MODULE_TYPE
  | typeof TEMPERATURE_MODULE_TYPE
  | typeof THERMOCYCLER_MODULE_TYPE
  | typeof HEATERSHAKER_MODULE_TYPE
  | typeof MAGNETIC_BLOCK_TYPE

// ModuleModel corresponds to top-level keys in shared-data/module/definitions/2
export type MagneticModuleModel =
  | typeof MAGNETIC_MODULE_V1
  | typeof MAGNETIC_MODULE_V2

export type TemperatureModuleModel =
  | typeof TEMPERATURE_MODULE_V1
  | typeof TEMPERATURE_MODULE_V2

export type ThermocyclerModuleModel =
  | typeof THERMOCYCLER_MODULE_V1
  | typeof THERMOCYCLER_MODULE_V2

export type HeaterShakerModuleModel = typeof HEATERSHAKER_MODULE_V1

export type MagneticBlockModel = typeof MAGNETIC_BLOCK_V1

export type ModuleModel =
  | MagneticModuleModel
  | TemperatureModuleModel
  | ThermocyclerModuleModel
  | HeaterShakerModuleModel
  | MagneticBlockModel

export type GripperModel = typeof GRIPPER_V1 | typeof GRIPPER_V1_1

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
  compatibleModules: ModuleType[]
}

export interface DeckCalibrationPoint {
  id: string
  position: CoordinateTuple
  displayName: string
}

export interface DeckLocations {
  orderedSlots: DeckSlot[]
  calibrationPoints: DeckCalibrationPoint[]
  fixtures: DeckFixture[]
}

export interface DeckMetadata {
  displayName: string
  tags: string[]
}

export interface DeckDefinition {
  otId: string
  cornerOffsetFromOrigin: CoordinateTuple
  dimensions: CoordinateTuple
  robot: DeckRobot
  locations: DeckLocations
  metadata: DeckMetadata
  layers: INode[]
}

export interface ModuleDimensions {
  bareOverallHeight: number
  overLabwareHeight: number
  xDimension: number
  yDimension: number
  footprintXDimension?: number
  footprintYDimension?: number
  labwareInterfaceXDimension?: number
  labwareInterfaceYDimension?: number
  lidHeight?: number
}

export interface ModuleCalibrationPoint {
  x: number
  y: number
  z?: number
}

export interface ModuleLayer {
  name: string
  pathDValues: string[]
}

// module definition that adheres to the v3 module json schema
export interface ModuleDefinition {
  moduleType: ModuleType
  model: ModuleModel
  labwareOffset: Coordinates
  dimensions: ModuleDimensions
  cornerOffsetFromSlot: Coordinates
  calibrationPoint: ModuleCalibrationPoint
  displayName: string
  quirks: string[]
  slotTransforms: SlotTransforms
  compatibleWith: ModuleModel[]
  twoDimensionalRendering: INode
}

export type AffineTransformMatrix = [
  [number, number, number],
  [number, number, number],
  [number, number, number]
]

export interface SlotTransforms {
  [deckOtId: string]: {
    [slotId: string]: {
      [transformKey in keyof ModuleDefinition]?: AffineTransformMatrix
    }
  }
}

export type ModuleOrientation = 'left' | 'right'

export type PipetteChannels = 1 | 8 | 96

export type PipetteDisplayCategory = typeof GEN1 | typeof GEN2 | typeof GEN3

export type PipetteMount = typeof LEFT | typeof RIGHT

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

// TODO(bc, 2021-05-27): the type of `model` here should be PipetteModel
// TODO(mc, 2019-10-14): update this type according to the schema
export interface PipetteModelSpecs extends PipetteNameSpecs {
  model: string
  backCompatNames?: string[]
  tipLength: {
    value: number
  }
}
export interface ProtocolMetadata {
  protocolName?: string
  author?: string
  description?: string | null
  created?: number
  lastModified?: number | null
  category?: string | null
  subcategory?: string | null
  tags?: string[]
  [key: string]: unknown
}
export interface PendingProtocolAnalysis {
  id: string
  status?: 'pending'
}
export interface ProtocolAnalysisSummary {
  id: string
  status: 'pending' | 'completed'
}
export interface LoadedPipette {
  id: string
  pipetteName: PipetteName
  mount: 'left' | 'right'
}
export interface LoadedLabware {
  id: string
  loadName: string
  definitionUri: string
  location: LabwareLocation
  offsetId?: string
  displayName?: string
}
export interface LoadedModule {
  id: string
  model: ModuleModel
  location: {
    slotName: string
  }
  serialNumber: string
}
export interface Liquid {
  id: string
  displayName: string
  description: string
  displayColor?: string
}

export interface AnalysisError {
  id: string
  detail: string
  errorType: string
  createdAt: string
}

export interface CompletedProtocolAnalysis {
  id: string
  status?: 'completed'
  result: 'ok' | 'not-ok' | 'error'
  pipettes: LoadedPipette[]
  labware: LoadedLabware[]
  modules: LoadedModule[]
  liquids: Liquid[]
  commands: RunTimeCommand[]
  errors: AnalysisError[]
  robotType?: RobotType
}

export interface ResourceFile {
  name: string
  role: string
}
export interface ProtocolResource {
  id: string
  createdAt: string
  protocolType: 'json' | 'python'
  robotType: RobotType
  metadata: ProtocolMetadata
  analysisSummaries: ProtocolAnalysisSummary[]
  files: ResourceFile[]
  key?: string
}

export interface ProtocolAnalysesResource {
  analyses: Array<PendingProtocolAnalysis | CompletedProtocolAnalysis>
}

export type MotorAxis = Array<
  'x' | 'y' | 'leftZ' | 'rightZ' | 'leftPlunger' | 'rightPlunger'
>

export type ThermalAdapterName =
  | 'PCR Adapter'
  | 'Deep Well Adapter'
  | '96 Flat Bottom Adapter'
  | 'Universal Flat Adapter'

// gripper definition that adheres to the v1 gripper json schema
export interface GripperDefinition {
  $otSharedSchema: string
  model: GripperModel
  schemaVersion: number
  displayName: string
  zMotorConfigurations: { idle: number; run: number }
  jawMotorConfigurations: { vref: number }
  gripForceProfile: {
    polynomial: [[number, number], [number, number]]
    defaultGripForce: number
    defaultHomeForce: number
    min: number
    max: number
  }
  geometry: {
    baseOffsetFromMount: [number, number, number]
    jawCenterOffsetFromBase: [number, number, number]
    pinOneOffsetFromBase: [number, number, number]
    pinTwoOffsetFromBase: [number, number, number]
    jawWidth: { min: number; max: number }
  }
}
