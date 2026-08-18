import type { LoadedLabwareLocation, RunTimeCommand } from '../command/types'
import type {
  PartialNozzles8Channel,
  RowChannels,
} from '../command/types/setup'
import type {
  CommandAnnotationV1,
  CommandAnnotationV2,
} from '../commandAnnotation/types'
import type { AddressableAreaName, CutoutFixtureId, CutoutId } from '../deck'
import type {
  ABSORBANCE_READER_TYPE,
  ABSORBANCE_READER_V1,
  AddressableAreaNamesWithFakes,
  AddressableAreaWithFakes,
  AreaTypeWithFakes,
  CutoutFixtureIdsWithFakes,
  EXTENSION,
  FLEX,
  FLEX_STACKER_MODULE_TYPE,
  FLEX_STACKER_MODULE_V1,
  GEN1,
  GEN2,
  GRIPPER_V1,
  GRIPPER_V1_1,
  GRIPPER_V1_2,
  GRIPPER_V1_3,
  HEATERSHAKER_MODULE_TYPE,
  HEATERSHAKER_MODULE_V1,
  LEFT,
  MAGDECK,
  MAGNETIC_BLOCK_TYPE,
  MAGNETIC_BLOCK_V1,
  MAGNETIC_MODULE_TYPE,
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V2,
  POSITION_REFERENCE_BOTTOM,
  POSITION_REFERENCE_CENTER,
  POSITION_REFERENCE_LIQUID_MENISCUS,
  POSITION_REFERENCE_TOP,
  RIGHT,
  TEMPDECK,
  TEMPERATURE_MODULE_TYPE,
  TEMPERATURE_MODULE_V1,
  TEMPERATURE_MODULE_V2,
  THERMOCYCLER,
  THERMOCYCLER_MODULE_TYPE,
  THERMOCYCLER_MODULE_V1,
  THERMOCYCLER_MODULE_V2,
  VACUUM_MODULE_TYPE,
  VACUUM_MODULE_V1,
} from './constants'
import type { PipetteName } from './pipettes'

export type RobotType = 'OT-2 Standard' | 'OT-3 Standard'

export interface RobotDefinition {
  displayName: string
  robotType: RobotType
  models: string[]
  extents: CoordinateTuple
  paddingOffsets: {
    rear: number
    front: number
    leftSide: number
    rightSide: number
  }
  mountOffsets: {
    left: CoordinateTuple
    right: CoordinateTuple
    gripper?: CoordinateTuple
  }
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
  geometryDefinitionId?: string | null
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
  | 'adapter'
  | 'lid'
  | 'system'
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

export interface Vector2D {
  x: number
  y: number
}
export interface Vector3D {
  x: number
  y: number
  z: number
}

export type LabwareOffset = Vector3D

export interface OnLabwareOffsetLocationSequenceComponent {
  kind: 'onLabware'
  labwareUri: string
}

export interface OnModuleOffsetLocationSequenceComponent {
  kind: 'onModule'
  moduleModel: ModuleModel
}

export interface OnAddressableAreaOffsetLocationSequenceComponent {
  kind: 'onAddressableArea'
  addressableAreaName: AddressableAreaName
}

export type LabwareOffsetLocationSequenceComponent =
  | OnLabwareOffsetLocationSequenceComponent
  | OnModuleOffsetLocationSequenceComponent
  | OnAddressableAreaOffsetLocationSequenceComponent

export type LabwareOffsetLocationSequence =
  LabwareOffsetLocationSequenceComponent[]

export interface LegacyLabwareOffsetLocation {
  slotName: string
  moduleModel?: ModuleModel
  definitionUri?: string
}

export interface LabwareOffsetRecord {
  id: string
  createdAt: string
  definitionUri: string
  location: LegacyLabwareOffsetLocation
  locationSequence?: LabwareOffsetLocationSequence
  vector: LabwareOffset
}

// 1. Valid pipette type for a container (i.e. is there multi channel access?)
// 2. Is the container a tiprack?
export interface LabwareParameters {
  loadName: string
  format: string
  isTiprack: boolean
  tipLength?: number
  isMagneticModuleCompatible: boolean
  isDeckSlotCompatible?: boolean
  magneticModuleEngageHeight?: number
  quirks?: string[]
  isMovableAdapter?: boolean
}

export interface LabwareBrand {
  brand: string
  brandId?: string[]
  links?: string[]
}

export interface CircularWellShape {
  shape: 'circular'
  diameter: number
}
export interface RectangularWellShape {
  shape: 'rectangular'
  xDimension: number
  yDimension: number
}

export type LabwareWellShapeProperties =
  CircularWellShape | RectangularWellShape

// well without x,y,z
export type LabwareWellProperties = LabwareWellShapeProperties & {
  depth: number
  totalLiquidVolume: number
}

export type LabwareWell = LabwareWellProperties & {
  x: number
  y: number
  z: number
  geometryDefinitionId?: string
}

export interface SphericalSegment {
  shape: 'spherical'
  radiusOfCurvature: number
  topHeight: number
  bottomHeight: number
}

export interface ConicalFrustum {
  shape: 'conical'
  bottomDiameter: number
  topDiameter: number
  topHeight: number
  bottomHeight: number
}

export interface CuboidalFrustum {
  shape: 'cuboidal'
  bottomXDimension: number
  bottomYDimension: number
  topXDimension: number
  topYDimension: number
  topHeight: number
  bottomHeight: number
}

export interface SquaredConeSegment {
  shape: 'squaredcone'
  bottomCrossSection: 'circular' | 'rectangular'
  circleDiameter: number
  rectangleXDimension: number
  rectangleYDimension: number
  topHeight: number
  bottomHeight: number
}

export interface RoundedCuboidSegment {
  shape: 'roundedcuboid'
  bottomCrossSection: 'circular' | 'rectangular'
  circleDiameter: number
  rectangleXDimension: number
  rectangleYDimension: number
  topHeight: number
  bottomHeight: number
}

export type WellSegment =
  | CuboidalFrustum
  | ConicalFrustum
  | SquaredConeSegment
  | SphericalSegment
  | RoundedCuboidSegment

export interface HeightVolumePair {
  height: number
  volume: number
}

export interface InnerWellGeometry {
  sections: WellSegment[]
}
export interface UserDefinedVolumes {
  heightToVolumeMap: HeightVolumePair[]
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

export interface AxisAlignedBoundingBox2D {
  backLeft: Vector2D
  frontRight: Vector2D
}

export interface AxisAlignedBoundingBox3D {
  backLeftBottom: Vector3D
  frontRightTop: Vector3D
}

export interface Extents {
  total: AxisAlignedBoundingBox3D
}

export interface SlotFootprintAsChildFeature {
  z: number
  backLeft: Vector2D
  frontRight: Vector2D
}

export interface SlotFootprintAsParentFeature {
  z: number
  backLeft: Vector2D
  frontRight: Vector2D
}

export interface LocatingFeatures {
  slotFootprintAsChild?: SlotFootprintAsChildFeature
  slotFootprintAsParent?: SlotFootprintAsParentFeature
}

export type LabwareRoles =
  'labware' | 'adapter' | 'fixture' | 'maintenance' | 'lid' | 'system'

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
  allowedRoles?: LabwareRoles[]
  stackingOffsetWithLabware?: Record<string, LabwareOffset>
  stackingOffsetWithModule?: Record<string, LabwareOffset>
  stackLimit?: number
  compatibleParentLabware?: string[]
  innerLabwareGeometry?: Record<
    string,
    InnerWellGeometry | UserDefinedVolumes
  > | null
}

export interface LabwareDefinition3 {
  version: number
  $otSharedSchema: '#/labware/schemas/3'
  schemaVersion: 3
  namespace: string
  metadata: LabwareMetadata
  extents: Extents
  features: LocatingFeatures
  parameters: LabwareParameters
  brand: LabwareBrand
  ordering: string[][]
  wells: LabwareWellMap
  groups: LabwareWellGroup[]
  allowedRoles?: LabwareRoles[]
  stackingOffsetWithLabware?: Record<string, LabwareOffset>
  legacyStackingOffsetWithLabware?: Record<string, LabwareOffset>
  stackingOffsetWithModule?: Record<string, LabwareOffset>
  stackLimit?: number
  compatibleParentLabware?: string[]
  innerLabwareGeometry?: Record<string, InnerWellGeometry> | null
}

// LabwareDefinition1 deliberately excluded.
// I'm pretty sure nothing in the frontend needs to deal with it anymore.
export type LabwareDefinition = LabwareDefinition2 | LabwareDefinition3

export interface LabwareDefinitionsByURI {
  [defURI: string]: LabwareDefinition
}
export interface LabwareDef2ByDefURI {
  [defUri: string]: LabwareDefinition2
}
export interface LegacyLabwareDefByName {
  [name: string]: LabwareDefinition1
}

export type ModuleType =
  | typeof MAGNETIC_MODULE_TYPE
  | typeof TEMPERATURE_MODULE_TYPE
  | typeof THERMOCYCLER_MODULE_TYPE
  | typeof HEATERSHAKER_MODULE_TYPE
  | typeof MAGNETIC_BLOCK_TYPE
  | typeof ABSORBANCE_READER_TYPE
  | typeof FLEX_STACKER_MODULE_TYPE
  | typeof VACUUM_MODULE_TYPE

// ModuleModel corresponds to top-level keys in shared-data/module/definitions/2
export type MagneticModuleModel =
  typeof MAGNETIC_MODULE_V1 | typeof MAGNETIC_MODULE_V2

export type TemperatureModuleModel =
  typeof TEMPERATURE_MODULE_V1 | typeof TEMPERATURE_MODULE_V2

export type ThermocyclerModuleModel =
  typeof THERMOCYCLER_MODULE_V1 | typeof THERMOCYCLER_MODULE_V2

export type HeaterShakerModuleModel = typeof HEATERSHAKER_MODULE_V1

export type MagneticBlockModel = typeof MAGNETIC_BLOCK_V1

export type AbsorbanceReaderModel = typeof ABSORBANCE_READER_V1

export type FlexStackerModuleModel = typeof FLEX_STACKER_MODULE_V1

export type VacuumModuleModel = typeof VACUUM_MODULE_V1

export type ModuleModel =
  | MagneticModuleModel
  | TemperatureModuleModel
  | ThermocyclerModuleModel
  | HeaterShakerModuleModel
  | MagneticBlockModel
  | AbsorbanceReaderModel
  | FlexStackerModuleModel
  | VacuumModuleModel

export type GripperModel =
  | typeof GRIPPER_V1
  | typeof GRIPPER_V1_1
  | typeof GRIPPER_V1_2
  | typeof GRIPPER_V1_3

export type ModuleModelWithLegacy =
  ModuleModel | typeof THERMOCYCLER | typeof MAGDECK | typeof TEMPDECK

export interface Dimensions {
  xDimension: number
  yDimension: number
  zDimension: number
}

export interface DeckRobot {
  model: RobotType
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

export type CutoutIdToCutoutFixtureId = {
  [cutoutId in CutoutId]?: CutoutFixtureId
}

export type CutoutFixtureGroup = {
  [cutoutId in CutoutId]?: CutoutIdToCutoutFixtureId[]
}

export interface CutoutFixture {
  id: CutoutFixtureId
  mayMountTo: CutoutId[]
  displayName: string
  providesAddressableAreas: Record<CutoutId, AddressableAreaName[]>
  expectOpentronsModuleSerialNumber: boolean
  fixtureGroup: CutoutFixtureGroup
  height: number
}

export interface FakeCutoutFixture extends Omit<
  CutoutFixture,
  'id' | 'providesAddressableAreas'
> {
  id: CutoutFixtureIdsWithFakes
  providesAddressableAreas: Record<
    CutoutId,
    AddressableAreaNamesWithFakes[] | AddressableAreaName[]
  >
}

export type CutoutFixtureWithFakes = FakeCutoutFixture | CutoutFixture

export type AreaType =
  | 'slot'
  | 'movableTrash'
  | 'wasteChute'
  | 'fixedTrash'
  | 'stagingSlot'
  | 'lidDock'
  | 'thermocycler'
  | 'heaterShaker'
  | 'temperatureModule'
  | 'magneticBlock'
  | 'absorbanceReader'
  | 'flexStacker'
  | 'vacuumModule'

export interface AddressableArea {
  id: AddressableAreaName
  areaType: AreaType
  offsetFromCutoutFixture: CoordinateTuple
  boundingBox: Dimensions
  displayName: string
  compatibleModuleTypes: ModuleType[]
  ableToDropLabware?: boolean
  ableToDropTips?: boolean
  matingSurfaceUnitVector?: UnitVectorTuple
}

export interface FakeAddressableArea extends Omit<
  AddressableArea,
  'id' | 'areaType'
> {
  id: AddressableAreaNamesWithFakes
  areaType: AreaTypeWithFakes
}

export interface DeckMetadata {
  displayName: string
  tags: string[]
}

export interface DeckCutout {
  id: CutoutId
  position: CoordinateTuple
  displayName: string
}

export interface LegacyFixture {
  id: string
  slot: string
  labware: string
  displayName: string
}

export interface DeckLocations {
  addressableAreas: AddressableArea[]
  calibrationPoints: DeckCalibrationPoint[]
  cutouts: DeckCutout[]
  legacyFixtures: LegacyFixture[]
}

export interface DeckLocationsWithFakes extends Omit<
  DeckLocations,
  'addressableAreas' | 'calibrationPoints' | 'legacyFixtures'
> {
  addressableAreas: AddressableAreaWithFakes[]
}

export interface DeckDefinition {
  otId: string
  cornerOffsetFromOrigin: CoordinateTuple
  dimensions: CoordinateTuple
  robot: DeckRobot
  locations: DeckLocations
  metadata: DeckMetadata
  cutoutFixtures: CutoutFixture[]
}

export interface DeckDefinitionWithFakes extends Omit<
  DeckDefinition,
  | 'locations'
  | 'cutoutFixtures'
  | 'otId'
  | 'cornerOffsetFromOrigin'
  | 'dimensions'
  | 'metadata'
  | 'robot'
> {
  locations: DeckLocationsWithFakes
  cutoutFixtures: CutoutFixtureWithFakes[]
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
  maxStackerFillHeight?: number
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
  labwareOffset: Vector3D
  dimensions: ModuleDimensions
  cornerOffsetFromSlot: Vector3D
  calibrationPoint: ModuleCalibrationPoint
  displayName: string
  quirks: string[]
  slotTransforms: SlotTransforms
  compatibleWith: ModuleModel[]
}

type AffineTransformRow = [number, number, number, number]
export type AffineTransformMatrix = [
  AffineTransformRow,
  AffineTransformRow,
  AffineTransformRow,
  AffineTransformRow,
]

export interface SlotTransforms {
  [deckOtId: string]:
    | undefined
    | {
        [slotId: string]:
          | undefined
          | {
              [transformKey in keyof ModuleDefinition]?: AffineTransformMatrix
            }
      }
}

export type ModuleOrientation = 'left' | 'right'

export type PipetteChannels = 1 | 8 | 96

export type ActiveNozzleNumber =
  PipetteChannels | PartialNozzles8Channel | RowChannels

export type PipetteDisplayCategory = typeof GEN1 | typeof GEN2 | typeof FLEX

export type PipetteMount = typeof LEFT | typeof RIGHT
export type GantryMount = typeof LEFT | typeof RIGHT | typeof EXTENSION
export interface FlowRateSpec {
  value: number
  min: number
  max: number
}

interface PlungerPositionsConfiguration {
  top: number
  bottom: number
  blowout: number
  drop: number
}

interface pressAndCamConfigurationValues {
  speed: number
  distance: number
  current: number
  tipOverlaps: { [version: string]: { [labwareURI: string]: number } }
}
export interface PipetteV2GeneralSpecs {
  displayName: string
  model: string
  displayCategory: PipetteDisplayCategory
  validNozzleMaps: {
    maps: { [nozzleMapKey: string]: string[] }
  }
  pickUpTipConfigurations: {
    pressFit: {
      presses: number
      increment: number
      configurationsByNozzleMap: {
        [nozzleMapKey: string]: {
          [tipType: string]: pressAndCamConfigurationValues
        }
      }
    }
  }
  dropTipConfigurations: {
    plungerEject: {
      current: number
      speed: number
    }
  }
  plungerMotorConfigurations: {
    idle: number
    run: number
  }
  plungerPositionsConfigurations: {
    default: PlungerPositionsConfiguration
    lowVolumeDefault?: PlungerPositionsConfiguration
  }
  availableSensors: {
    sensors: string[]
    capacitive?: { count: number }
    environment?: { count: number }
    pressure?: { count: number }
  }
  partialTipConfigurations: {
    partialTipSupported: boolean
    availableConfigurations: number[] | null
  }
  channels: PipetteChannels
  shaftDiameter: number
  shaftULperMM: number
  backCompatNames: string[]
  backlashDistance: number
  quirks: string[]
  plungerHomingConfigurations: {
    current: number
    speed: number
  }
}

interface NozzleInfo {
  key: string
  orderedNozzles: string[]
}
export interface PipetteV2GeometrySpecs {
  nozzleOffset: number[]
  pipetteBoundingBoxOffsets: {
    backLeftCorner: number[]
    frontRightCorner: number[]
  }
  pathTo3D: string
  orderedRows: Record<number, NozzleInfo>
  orderedColumns: Record<number, NozzleInfo>
  nozzleMap: Record<string, number[]>
}

export interface SupportedTip {
  aspirate: {
    default: Record<string, number[][]>
  }
  defaultAspirateFlowRate: {
    default: number
    valuesByApiLevel: Record<string, number>
  }
  defaultBlowOutFlowRate: {
    default: number
    valuesByApiLevel: Record<string, number>
  }
  defaultDispenseFlowRate: {
    default: number
    valuesByApiLevel: Record<string, number>
  }
  defaultPushOutVolume: number
  defaultTipLength: number
  dispense: {
    default: Record<string, number[][]>
  }
  defaultReturnTipHeight?: number
  defaultFlowAcceleration?: number
  uiMaxFlowRate?: number
}

export interface SupportedTips {
  [tipType: string]: SupportedTip
}

export interface PipetteV2LiquidSpecs {
  $otSharedSchema: string
  supportedTips: SupportedTips
  maxVolume: number
  minVolume: number
  defaultTipracks: string[]
}

export type GenericAndGeometrySpecs = PipetteV2GeneralSpecs &
  PipetteV2GeometrySpecs

export interface PipetteV2Specs extends GenericAndGeometrySpecs {
  $otSharedSchema: string
  liquids: Record<string, PipetteV2LiquidSpecs>
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
  result: 'ok' | 'not-ok' | 'error' | 'parameter-value-required'
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
  location: LoadedLabwareLocation
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
  displayName: string | null
  description: string
  displayColor?: string
  totalLiquids?: number
}

// TODO(ND, 12/17/2024): investigate why typescript doesn't allow Array<[number, number]>
export type LiquidHandlingPropertyByVolume = number[][]
export type PositionReference =
  | typeof POSITION_REFERENCE_BOTTOM
  | typeof POSITION_REFERENCE_CENTER
  | typeof POSITION_REFERENCE_TOP
  | typeof POSITION_REFERENCE_LIQUID_MENISCUS

type BlowoutLocation = 'source' | 'destination' | 'trash'
interface DelayParams {
  duration: number
}
export interface TipPosition {
  positionReference: PositionReference
  offset: Vector3D
}
export interface DelayProperties {
  enable: boolean
  params?: DelayParams
}
interface TouchTipParams {
  zOffset: number
  mmFromEdge: number
  speed: number
}
export interface TouchTipProperties {
  enable: boolean
  params?: TouchTipParams
}

interface MixParams {
  repetitions: number
  volume: number
}
export interface MixProperties {
  enable: boolean
  params?: MixParams
}
interface BlowoutParams {
  location: BlowoutLocation
  flowRate: number
}
export interface BlowoutProperties {
  enable: boolean
  params?: BlowoutParams
}
export interface Submerge {
  startPosition: TipPosition
  speed: number
  delay: DelayProperties
}
interface BaseRetract {
  endPosition: TipPosition
  speed: number
  airGapByVolume: LiquidHandlingPropertyByVolume
  touchTip: TouchTipProperties
  delay: DelayProperties
}
export type RetractAspirate = BaseRetract
export interface RetractDispense extends BaseRetract {
  blowout: BlowoutProperties
}
interface BaseLiquidHandlingProperties<RetractType> {
  submerge: Submerge
  retract: RetractType
  flowRateByVolume: LiquidHandlingPropertyByVolume
  correctionByVolume: LiquidHandlingPropertyByVolume
  delay: DelayProperties
}
export interface AspirateProperties extends BaseLiquidHandlingProperties<RetractAspirate> {
  aspiratePosition: TipPosition
  preWet: boolean
  mix: MixProperties
}
export interface SingleDispenseProperties extends BaseLiquidHandlingProperties<RetractDispense> {
  dispensePosition: TipPosition
  mix: MixProperties
  pushOutByVolume: LiquidHandlingPropertyByVolume
}
export interface MultiDispenseProperties extends BaseLiquidHandlingProperties<RetractDispense> {
  dispensePosition: TipPosition
  conditioningByVolume: LiquidHandlingPropertyByVolume
  disposalByVolume: LiquidHandlingPropertyByVolume
}
export interface ByTipTypeSetting {
  tiprack: string
  aspirate: AspirateProperties
  singleDispense: SingleDispenseProperties
  multiDispense?: MultiDispenseProperties
}
export interface ByPipetteSetting {
  pipetteModel: string
  byTipType: ByTipTypeSetting[]
}
export interface LiquidClass {
  liquidClassName: string
  displayName: string
  description: string
  schemaVersion: number
  namespace: string
  byPipette: ByPipetteSetting[]
}

export interface AnalysisError {
  id: string
  detail: string
  errorType: string
  createdAt: string
}

export interface NumberParameter extends BaseRunTimeParameter {
  type: NumberParameterType
  min: number
  max: number
  default: number
  value: number
}

export interface NumberChoice {
  displayName: string
  value: number
}

export interface BooleanChoice {
  displayName: string
  value: boolean
}

export interface StringChoice {
  displayName: string
  value: string
}

export type Choice = NumberChoice | BooleanChoice | StringChoice

interface NumberChoiceParameter extends BaseRunTimeParameter {
  type: NumberParameterType
  choices: NumberChoice[]
  default: number
  value: number
}

interface BooleanChoiceParameter extends BaseRunTimeParameter {
  type: BooleanParameterType
  choices: BooleanChoice[]
  default: boolean
  value: boolean
}

interface StringChoiceParameter extends BaseRunTimeParameter {
  type: StringParameterType
  choices: StringChoice[]
  default: string
  value: string
}

export type ChoiceParameter =
  NumberChoiceParameter | BooleanChoiceParameter | StringChoiceParameter

interface BooleanParameter extends BaseRunTimeParameter {
  type: BooleanParameterType
  default: boolean
  value: boolean
}

export interface CsvFileParameterFileData {
  id?: string
  file?: File | null
  filePath?: string
  fileName?: string
  name?: string
}

export interface CsvFileParameter extends BaseRunTimeParameter {
  type: CsvFileParameterType
  file?: CsvFileParameterFileData | null
}

type NumberParameterType = 'int' | 'float'
type BooleanParameterType = 'bool'
type StringParameterType = 'str'
type CsvFileParameterType = 'csv_file'

interface BaseRunTimeParameter {
  displayName: string
  variableName: string
  description: string
  suffix?: string
}

export type ValueRunTimeParameter = Exclude<RunTimeParameter, CsvFileParameter>

export type RunTimeParameter =
  BooleanParameter | ChoiceParameter | NumberParameter | CsvFileParameter

export interface CommandPreconditions {
  isCameraUsed: boolean
}
export type CameraId = 'ot_system_camera'

// TODO(BC, 10/25/2023): this type (and others in this file) probably belong in api-client, not here
export interface CompletedProtocolAnalysis {
  id: string
  status?: 'completed'
  result: 'ok' | 'not-ok' | 'error' | 'parameter-value-required'
  pipettes: LoadedPipette[]
  labware: LoadedLabware[]
  modules: LoadedModule[]
  liquids: Liquid[]
  commands: RunTimeCommand[]
  errors: AnalysisError[]
  robotType?: RobotType | null
  runTimeParameters?: RunTimeParameter[]
  commandAnnotations?: CommandAnnotationV1[] | CommandAnnotationV2[]
  commandPreconditions?: CommandPreconditions
  labwareOffsets?: LabwareOffsetRecord[]
}

export interface ResourceFile {
  name: string
  role: string
}
export interface ProtocolResource {
  id: string
  createdAt: string
  protocolType: 'json' | 'python'
  protocolKind: 'standard' | 'quick-transfer'
  robotType: RobotType
  metadata: ProtocolMetadata
  analysisSummaries: ProtocolAnalysisSummary[]
  files: ResourceFile[]
  key?: string
}

export interface ProtocolAnalysesResource {
  analyses: Array<PendingProtocolAnalysis | CompletedProtocolAnalysis>
}
export type MotorAxis =
  | 'x'
  | 'y'
  | 'leftZ'
  | 'rightZ'
  | 'leftPlunger'
  | 'rightPlunger'
  | 'extensionZ'
  | 'extensionJaw'
  | 'axis96ChannelCam'

export type MotorAxes = MotorAxis[]

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
    defaultIdleForce: number
    min: number
    max: number
  }
  geometry: {
    baseOffsetFromMount: [number, number, number]
    jawCenterOffsetFromBase: [number, number, number]
    pinOneOffsetFromBase: [number, number, number]
    pinTwoOffsetFromBase: [number, number, number]
    jawWidth: { min: number; max: number }
    maxAllowedGripError: number
  }
}

export type StatusBarAnimation =
  'idle' | 'confirm' | 'updating' | 'disco' | 'off'

export type StatusBarAnimations = StatusBarAnimation[]

export interface CutoutConfig {
  cutoutId: CutoutId
  cutoutFixtureId: CutoutFixtureId
  opentronsModuleSerialNumber?: string
}

export type DeckConfiguration = CutoutConfig[]

type CutoutConfigWithoutCutoutFixtureId = Omit<CutoutConfig, 'cutoutFixtureId'>

export interface CutoutConfigMap extends CutoutConfigWithoutCutoutFixtureId {
  addressableAreaId: AddressableAreaNamesWithFakes
  cutoutFixtureId: CutoutFixtureIdsWithFakes
}

export type NozzleLayoutConfig =
  'single' | 'column' | 'row' | 'full' | 'subrect'
