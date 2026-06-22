import type {
  ABSORBANCE_READER_TYPE,
  AddressableArea,
  CreateCommand,
  FLEX_STACKER_MODULE_TYPE,
  FlexStackerStoredLabwareGroup,
  HEATERSHAKER_MODULE_TYPE,
  Height,
  LabwareDefinition2,
  LabwareLocation,
  LabwareMovementStrategy,
  LoadedLabwareLocation,
  MAGNETIC_BLOCK_TYPE,
  MAGNETIC_MODULE_TYPE,
  ModuleModel,
  ModuleType,
  PipetteMount as Mount,
  NozzleConfigurationStyle,
  PipetteName,
  PipetteV2Specs,
  PositionReference,
  PrimaryNozzleConfigurationStyle,
  ShakeSpeedParams,
  StackerStoredLabwareDefinitionURIs,
  TCExtendedProfileParams,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  VACUUM_MODULE_TYPE,
  VacuumRunProfileParams,
  Width,
} from '@opentrons/shared-data'
import type {
  AUTOMATIC,
  CLEAN,
  DIRTY,
  EMPTY,
  MANUAL,
  TEMPERATURE_APPROACHING_TARGET,
  TEMPERATURE_AT_TARGET,
  TEMPERATURE_DEACTIVATED,
  VACUUM_MODE_POWER,
  VACUUM_MODE_PRESSURE,
  VACUUM_VENT_CLOSED,
  VACUUM_VENT_OPEN,
} from './constants'

// Copied from PD
export type DeckSlot = string
type THERMOCYCLER_STATE = 'thermocyclerState'
type THERMOCYCLER_PROFILE = 'thermocyclerProfile'

export const TOUCHED_PIPETTABLE_LABWARE: 'TOUCHED_PIPETTABLE_LABWARE' =
  'TOUCHED_PIPETTABLE_LABWARE'
export interface LabwareTemporalProperties {
  // a stack of ids from top to bottom
  stack: string[]
  // The single entity this labware is stacked on (labware, module, slot, hopper, etc.).
  stackedOnNode?: LoadedLabwareLocation
  // The single labware ID this labware contains when that applies.
  contains?: string
  // we currently use this property only to track if a lid has been placed on a "pipettable" labware that could presumably contain liquid
  // we can expand this type in the future to track other types of sterility for various labware types
  sterility?: typeof TOUCHED_PIPETTABLE_LABWARE
  // this is needed for PV to determine which labware is being moved
  // into the hopper based on the setStoredLabware count
  setStoredLabwareCount?: number
  fillCount?: number
}

export interface PipetteTemporalProperties {
  mount: Mount
  //  entityId is either a labwareId or a trashBin/wasteChute id
  entityId?: string
  //  primary nozzle's wellName if over a labware
  wellName?: string
  //  pipette's nozzle configuration
  nozzles?: NozzleConfigurationStyle
  //  current tiprack assosciated with pipette
  tiprackId?: string
  //  last primary tip well accessed (used for return tip)
  tipWell?: string
  // primary nozzle to use
  primaryNozzle?: PrimaryNozzleConfigurationStyle
  // back-left nozzle for QUADRANT configurations
  backLeftNozzle?: PrimaryNozzleConfigurationStyle
}

export interface MagneticModuleState {
  type: typeof MAGNETIC_MODULE_TYPE
  engaged: boolean
}

export type TemperatureStatus =
  | typeof TEMPERATURE_DEACTIVATED
  | typeof TEMPERATURE_AT_TARGET
  | typeof TEMPERATURE_APPROACHING_TARGET

export interface TemperatureModuleState {
  type: typeof TEMPERATURE_MODULE_TYPE
  status: TemperatureStatus
  targetTemperature: number | null
}

export interface Point {
  x: number
  y: number
  z?: number
}

export interface ThermocyclerModuleState {
  type: typeof THERMOCYCLER_MODULE_TYPE

  lidTargetTemp: number | null /** null means lid is deactivated. */

  /** What the thermal block is currently doing. */
  currentBlockActivity:
    | ProfileBlockActivity
    | TargetTempBlockActivity
    | DeactivatedBlockActivity

  /** If false, closed. If null, unknown. */
  lidOpen: boolean | null

  /** Useful for generating unique task IDs every time a new profile is started. */
  numProfilesStarted: number
}

/**
 * A profile has been started on this Thermocycler
 * and not yet awaited, so it's possibly still ongoing.
 */
export interface ProfileBlockActivity {
  type: 'profile'
  /** The steps of the profile that's currently running. */
  profileElements: TCExtendedProfileParams['profileElements']
  /**
   * The ID of the concurrent task that represents this profile.
   *
   * `null` for unknown. Theoretically, the task ID is always knowable,
   * but sometimes it's only available from a startRunExtendedProfile result,
   * and step-generation only has access to the startRunExtendedProfile params.
   */
  taskId: string | null
}

export interface VacuumPumpProfileActivity {
  type: 'profile'
  profileElements: VacuumRunProfileParams['profile']
  taskId: string
  ventAfter: boolean
}

interface BaseVacuumPumpTimedHold {
  type: 'timedHold'
  durationSeconds: number
  taskId: string
  ventAfter: boolean
}
interface VacuumPumpPressureTimedHold extends BaseVacuumPumpTimedHold {
  mode: typeof VACUUM_MODE_PRESSURE
  targetPressure: number
}
interface VacuumPumpPowerTimedHold extends BaseVacuumPumpTimedHold {
  mode: typeof VACUUM_MODE_POWER
  targetPower: number
}
interface VacuumPumpPressureIndefiniteHold {
  type: 'indefiniteHold'
  mode: typeof VACUUM_MODE_PRESSURE
  targetPressure: number
}

interface VacuumPumpPowerIndefiniteHold {
  type: 'indefiniteHold'
  mode: typeof VACUUM_MODE_POWER
  targetPower: number
}

export interface VacuumPumpDeactivatedActivity {
  type: 'pumpDeactivated'
}

/** The thermal block is targeting a constant temperature, outside of a profile. */
export interface TargetTempBlockActivity {
  type: 'blockTargetTemp'
  blockTargetTemp: number
}

export interface DeactivatedBlockActivity {
  type: 'blockDeactivated'
}

export interface HeaterShakerModuleState {
  type: typeof HEATERSHAKER_MODULE_TYPE
  targetTemp: number | null
  targetSpeed: number | null
  latchOpen: boolean | null
}

export interface MagneticBlockState {
  type: typeof MAGNETIC_BLOCK_TYPE
}

export interface Initialization {
  mode: 'single' | 'multi'
  wavelengths: number[]
  referenceWavelength?: number
}

export interface AbsorbanceReaderState {
  type: typeof ABSORBANCE_READER_TYPE
  lidOpen: boolean | null
  initialization: Initialization | null
}

export interface FlexStackerModuleState {
  type: typeof FLEX_STACKER_MODULE_TYPE
  storedLabwareDetails: StackerStoredLabwareDefinitionURIs | null
  // labware in hopper is the bottom up
  labwareInHopper: FlexStackerStoredLabwareGroup[] | null
  labwareOnShuttle: FlexStackerStoredLabwareGroup | null
  // this is needed in order to differentiate between the different
  // off-deck labwares and when they get loaded onto the hopper for setStoredLabware
  setStoredLabwareCount?: number
  fillCount?: number
}

export type VentStatus = typeof VACUUM_VENT_OPEN | typeof VACUUM_VENT_CLOSED

export type VacuumPumpActivity =
  | VacuumPumpProfileActivity
  | VacuumPumpDeactivatedActivity
  | VacuumPumpPressureTimedHold
  | VacuumPumpPowerTimedHold
  | VacuumPumpPressureIndefiniteHold
  | VacuumPumpPowerIndefiniteHold
export interface VacuumModuleState {
  type: typeof VACUUM_MODULE_TYPE
  ventStatus: VentStatus | null
  // timed holds and profiles have a task ID, so this is handy as a unique identifier
  numPumpActivitiesStarted: number
  currentPumpActivity: VacuumPumpActivity
}

export type ModuleState =
  | MagneticModuleState
  | TemperatureModuleState
  | ThermocyclerModuleState
  | HeaterShakerModuleState
  | MagneticBlockState
  | AbsorbanceReaderState
  | FlexStackerModuleState
  | VacuumModuleState
export interface ModuleTemporalProperties {
  slot: DeckSlot
  moduleState: ModuleState
}

export interface LabwareEntity {
  id: string
  labwareDefURI: string
  def: LabwareDefinition2
  pythonName: string
}

export interface LabwareEntities {
  [labwareId: string]: LabwareEntity
}

export interface ModuleEntity {
  id: string
  type: ModuleType
  model: ModuleModel
  pythonName: string
}

export interface ModuleEntities {
  [moduleId: string]: ModuleEntity
}

export interface NormalizedPipetteById {
  [pipetteId: string]: {
    name: PipetteName
    id: string
    tiprackDefURI: string[]
  }
}

export interface LiquidEntity {
  displayName: string
  displayColor: string
  description: string | null
  pythonName: string
  liquidGroupId: string
  liquidClass?: string | null
}

export interface LiquidEntities {
  [liquidId: string]: LiquidEntity
}

export type Ingredient = Omit<LiquidEntity, 'pythonName'>
export interface Ingredients {
  [liquidId: string]: Ingredient
}

export type AdditionalEquipmentName =
  | 'gripper'
  | 'wasteChute'
  | 'stagingArea'
  | 'trashBin'

export interface NormalizedAdditionalEquipmentById {
  [additionalEquipmentId: string]: {
    name: AdditionalEquipmentName
    id: string
    location: string
    //  Note: leaving as optional since gripper and stagingArea
    //  will never need a pythonName
    pythonName?: string
  }
}

export type AdditionalEquipmentEntity =
  NormalizedAdditionalEquipmentById[keyof NormalizedAdditionalEquipmentById]
export interface AdditionalEquipmentEntities {
  [additionalEquipmentId: string]: AdditionalEquipmentEntity
}

interface TrashEntity {
  id: string
  location: string
  pythonName: string
}

export type WasteChuteEntity = TrashEntity
export interface WasteChuteEntities {
  [wasteChuteId: string]: WasteChuteEntity
}

export type TrashBinEntity = TrashEntity
export interface TrashBinEntities {
  [trashBinId: string]: TrashBinEntity
}

export interface StagingAreaEntity {
  id: string
  location: string
}
export interface StagingAreaEntities {
  [stagingAreaId: string]: StagingAreaEntity
}

export interface GripperEntity {
  id: string
}
export interface GripperEntities {
  [gripperId: string]: GripperEntity
}

export type NormalizedPipette =
  NormalizedPipetteById[keyof NormalizedPipetteById]

// "entities" have only properties that are time-invariant
// when they are de-normalized, the definitions they reference are baked in

// Use this when you need to refer to a particular TYPE of tip rack (such as
// the opentrons_flex_96_tiprack_200ul). This is used in e.g. the hydrated step
// forms, where the user selects a tip rack type rather than a specific tip
// rack on the deck.
// This interfaces packages together the tip rack URI and the tip rack labware
// definition for convenience.
export interface TipRackWithDef extends LabwareDefinition2 {
  tiprackDefURI: string
}

// =========== PIPETTES ========
export type PipetteEntity = NormalizedPipette & {
  tiprackLabwareDef: LabwareDefinition2[]
  spec: PipetteV2Specs
  pythonName: string
}

export interface PipetteEntities {
  [pipetteId: string]: PipetteEntity
}

// ===== MIX-IN TYPES =====
export type ChangeTipOptions =
  | 'always'
  | 'once'
  | 'never'
  | 'perDest'
  | 'perSource'

export type PathOption = 'single' | 'multiAspirate' | 'multiDispense'

export interface InnerMixArgs {
  volume: number
  times: number
}

export interface InnerDelayArgs {
  seconds: number
}

interface CommonArgs {
  /** NOTE: stepNumber probably shouldn't be optional but making it optional
   * for the sake of not having to make too many changes for PD 8.5.2
   * this should be refactored to not be optional for PD 8.6.0
   * making it optional saves a lot of changes in unit tests
   */
  stepNumber?: number
  /** Optional user-readable name for this step */
  name?: string | null
  /** Optional user-readable description/notes for this step */
  description?: string | null
}

// ===== Processed form types. Used as args to call command creator fns =====

export type SharedTransferLikeArgs = CommonArgs & {
  tipRack: string // tipRackDefUri
  pipette: string // PipetteId
  nozzles: NozzleConfigurationStyle // setting for 96-channel
  primaryNozzle: PrimaryNozzleConfigurationStyle // setting for partial tip pick up

  sourceLabware: string
  destLabware: string
  /** volume is interpreted differently by different Step types */
  volume: number
  /** drop tip location entity id */
  dropTipLocation: string
  // ===== ASPIRATE SETTINGS =====
  /** Pre-wet tip with ??? uL liquid from the first source well. */
  preWetTip: boolean
  /** Touch tip after every aspirate */
  touchTipAfterAspirate: boolean
  /** Optional offset for touch tip after aspirate (if null, use PD default) */
  touchTipAfterAspirateOffsetMmFromTop: number
  /** Optional offset for touch tip after aspirate (if null, use PD default) */
  touchTipAfterAspirateMmFromEdge: number | null
  /** Optional speed for touch tip after aspirate (if null, use PD default) */
  touchTipAfterAspirateSpeed: number | null
  /** changeTip is interpreted differently by different Step types */
  changeTip: ChangeTipOptions
  /** Delay after every aspirate */
  aspirateDelay: InnerDelayArgs | null | undefined
  /** Air gap after every aspirate */
  aspirateAirGapVolume: number | null
  /** Flow rate in uL/sec for all aspirates */
  aspirateFlowRateUlSec: number
  /** offset from bottom of well in mm */
  aspirateOffsetFromBottomMm: number // TODO: deprecate this
  /** x offset mm */
  aspirateXOffset: number
  /** y offset mm */
  aspirateYOffset: number

  // ===== DISPENSE SETTINGS =====
  /** Air gap after dispense */
  dispenseAirGapVolume: number | null
  /** Delay after every dispense */
  dispenseDelay: InnerDelayArgs | null | undefined
  /** Touch tip in destination well after dispense */
  touchTipAfterDispense: boolean
  /** Optional offset for touch tip after dispense (if null, use PD default) */
  touchTipAfterDispenseOffsetMmFromTop: number
  /** Optional offset for touch tip after aspirate (if null, use PD default) */
  touchTipAfterDispenseMmFromEdge: number | null
  /** Optional speed for touch tip after dispense (if null, use PD default) */
  touchTipAfterDispenseSpeed: number | null
  /** Flow rate in uL/sec for all dispenses */
  dispenseFlowRateUlSec: number
  /** offset from bottom of well in mm */
  dispenseOffsetFromBottomMm: number // TODO: deprecate this
  /** x offset mm */
  dispenseXOffset: number
  /** y offset mm */
  dispenseYOffset: number
  /** will be non-null once introduced to quick transfer */
  pushOut: number | null

  /** If given, blow out in the specified destination after dispense at the end of each asp-dispense cycle */
  blowoutLocation: string | null | undefined
  blowoutFlowRateUlSec: number

  /** additional blowout params if the position needs to be more refined */
  blowoutOffsetFromTopMm: number | null
  blowoutXPosition: number | null
  blowoutYPosition: number | null
  blowoutPositionReference: string | null
  // ===== SETTINGS INTRODUCED WITH LIQUID CLASSES =====
  liquidClass: string | null // a liquid class name like "water" or null; "none" is not allowed
  aspiratePositionReference: PositionReference
  aspirateZOffset: number
  aspirateSubmergeSpeed: number | null
  aspirateSubmergeXOffset: number
  aspirateSubmergeYOffset: number
  aspirateSubmergeZOffset: number
  aspirateSubmergePositionReference: PositionReference
  aspirateSubmergeDelay: InnerDelayArgs | null
  aspirateRetractSpeed: number | null
  aspirateRetractXOffset: number
  aspirateRetractYOffset: number
  aspirateRetractZOffset: number
  aspirateRetractPositionReference: PositionReference
  aspirateRetractDelay: InnerDelayArgs | null
  dispensePositionReference: PositionReference
  dispenseZOffset: number
  dispenseSubmergeSpeed: number | null
  dispenseSubmergeXOffset: number
  dispenseSubmergeYOffset: number
  dispenseSubmergeZOffset: number
  dispenseSubmergePositionReference: PositionReference
  dispenseSubmergeDelay: InnerDelayArgs | null
  dispenseRetractSpeed: number | null
  dispenseRetractXOffset: number
  dispenseRetractYOffset: number
  dispenseRetractZOffset: number
  dispenseRetractPositionReference: PositionReference
  dispenseRetractDelay: InnerDelayArgs | null
  tipTracking: TipTrackingOption
  tipsSelected: string[][]
  tiprackSelected: string | null
}

export type ConsolidateArgs = SharedTransferLikeArgs & {
  commandCreatorFnName: 'consolidate'

  sourceWells: string[]
  destWell: string | null

  /** Mix in first well in chunk */
  mixFirstAspirate: InnerMixArgs | null | undefined
  /** Mix in destination well after dispense */
  mixInDestination: InnerMixArgs | null | undefined
}

export type TransferArgs = SharedTransferLikeArgs & {
  commandCreatorFnName: 'transfer'

  sourceWells: string[]
  destWells: string[] | null

  /** Mix in first well in chunk */
  mixBeforeAspirate: InnerMixArgs | null | undefined
  /** Mix in destination well after dispense */
  mixInDestination: InnerMixArgs | null | undefined
}

export type DistributeArgs = SharedTransferLikeArgs & {
  commandCreatorFnName: 'distribute'

  sourceWell: string
  destWells: string[]

  /** Disposal volume is added to the volume of the first aspirate of each asp-asp-disp cycle */
  disposalVolume: number | null | undefined
  /** Volume to condition the tip with during aspiration sequence */
  conditioningVolume: number | null

  /** Mix in first well in chunk */
  mixBeforeAspirate: InnerMixArgs | null | undefined
}

export type MixArgs = CommonArgs & {
  commandCreatorFnName: 'mix'
  tipRack: string // tipRackDefUri
  labware: string
  pipette: string
  nozzles: NozzleConfigurationStyle // setting for 96-channel
  wells: string[]
  /** Mix volume (should not exceed pipette max) */
  volume: number
  /** Times to mix (should be integer) */
  times: number
  /** Touch tip after mixing */
  touchTip: boolean
  touchTipMmFromTop: number
  /** change tip: see comments in step-generation/mix.js */
  changeTip: ChangeTipOptions
  /** drop tip location entity id */
  dropTipLocation: string
  /** If given, blow out in the specified destination after mixing each well */
  blowoutLocation: string | null | undefined
  blowoutFlowRateUlSec: number
  blowoutOffsetFromTopMm: number

  /** mix position offset relative to this PositionReference */
  positionReference: PositionReference
  /** x offset */
  xOffset: number
  /** y offset */
  yOffset: number
  /** z offset */
  zOffset: number

  /** flow rates in uL/sec */
  aspirateFlowRateUlSec: number
  dispenseFlowRateUlSec: number
  /** delays */
  aspirateDelaySeconds: number | null | undefined
  dispenseDelaySeconds: number | null | undefined
  finalPushOut: number
  tipTracking: TipTrackingOption
  tipsSelected: string[][]
  tiprackSelected: string | null
  primaryNozzle: PrimaryNozzleConfigurationStyle
}

export type PauseArgs = CommonArgs & {
  commandCreatorFnName: 'delay'
  message?: string
  seconds?: number
  pauseTemperature?: number | null
  meta:
    | {
        hours?: number
        minutes?: number
        seconds?: number
      }
    | null
    | undefined
}

export interface WaitForTemperatureArgs extends CommonArgs {
  moduleId: string
  commandCreatorFnName: 'waitForTemperature'
  celsius: number
  message?: string
}

export interface WaitForModuleTaskArgs extends CommonArgs {
  commandCreatorFnName: 'waitForModuleTask'

  /** This step will wait for this to happen before moving on. */
  // Note: Leaving room for this to become a union with stuff like 'temperatureModuleReachedTarget'.
  waitCondition:
    | 'thermocyclerProfileComplete'
    | 'vacuumProfileComplete'
    | 'vacuumStateComplete'
  moduleId: string
}

export type EngageMagnetArgs = CommonArgs & {
  height: number
  moduleId: string
  commandCreatorFnName: 'engageMagnet'
  message?: string
}

export type DisengageMagnetArgs = CommonArgs & {
  moduleId: string
  commandCreatorFnName: 'disengageMagnet'
  message?: string
}

export interface SetTemperatureArgs extends CommonArgs {
  moduleId: string
  commandCreatorFnName: 'setTemperature'
  celsius: number
  message?: string
}

export interface DeactivateTemperatureArgs extends CommonArgs {
  moduleId: string
  commandCreatorFnName: 'deactivateTemperature'
  message?: string
}

export type SetShakeSpeedArgs = ShakeSpeedParams & {
  moduleId: string
  commandCreatorFnName: 'setShakeSpeed'
  message?: string
}

export interface HeaterShakerArgs extends CommonArgs {
  moduleId: string | null
  rpm: number | null
  commandCreatorFnName: 'heaterShaker'
  targetTemperature: number | null
  latchOpen: boolean
  timerHours: number | null
  timerMinutes: number | null
  timerSeconds: number | null
  message?: string
}

const PROFILE_CYCLE: 'profileCycle' = 'profileCycle'
const PROFILE_STEP: 'profileStep' = 'profileStep'

interface ProfileStepItem {
  type: typeof PROFILE_STEP
  id: string
  title: string
  temperature: string
  durationMinutes: string
  durationSeconds: string
}

interface ProfileCycleItem {
  type: typeof PROFILE_CYCLE
  id: string
  steps: ProfileStepItem[]
  repetitions: string
}

interface VacuumProfileStepItem {
  type: typeof PROFILE_STEP
  id: string
  durationSeconds: number
  pumpData: VacuumPumpData
}

interface VacuumProfileCycleItem {
  type: typeof PROFILE_CYCLE
  id: string
  steps: VacuumProfileStepItem[]
  repetitions: number
}

// TODO IMMEDIATELY: ProfileStepItem -> ProfileStep, ProfileCycleItem -> ProfileCycle
export type ProfileItem = ProfileStepItem | ProfileCycleItem

/**
 * Emits a concurrent Thermocycler profile step. The protocol will proceed to the next
 * step immediately after the profile starts, and the profile will continue in the
 * background.
 */
export type ThermocyclerProfileStepArgs = CommonArgs & {
  commandCreatorFnName: THERMOCYCLER_PROFILE

  moduleId: string

  profileElements: TCExtendedProfileParams['profileElements']
  profileTargetLidTemp: number
  profileVolume: number

  meta?: {
    rawProfileItems: ProfileItem[]
  }

  message?: string
}

export interface ThermocyclerStateStepArgs extends CommonArgs {
  moduleId: string
  commandCreatorFnName: THERMOCYCLER_STATE
  blockTargetTemp: number | null
  lidTargetTemp: number | null
  lidOpen: boolean
  message?: string
}

export interface AbsorbanceReaderInitializeArgs extends CommonArgs {
  moduleId: string
  commandCreatorFnName: 'absorbanceReaderInitialize'
  measureMode: 'single' | 'multi'
  sampleWavelengths: number[]
  referenceWavelength?: number | null
  message?: string
}

export interface AbsorbanceReaderReadArgs extends CommonArgs {
  moduleId: string
  commandCreatorFnName: 'absorbanceReaderRead'
  fileName: string | null
  message?: string
}

export interface AbsorbanceReaderLidArgs extends CommonArgs {
  moduleId: string
  commandCreatorFnName: 'absorbanceReaderOpenLid' | 'absorbanceReaderCloseLid'
  message?: string
}

export type AbsorbanceReaderArgs =
  | AbsorbanceReaderInitializeArgs
  | AbsorbanceReaderReadArgs
  | AbsorbanceReaderLidArgs

export interface MoveLabwareArgs extends CommonArgs {
  commandCreatorFnName: 'moveLabware'
  labwareId: string
  newLocation: LabwareLocation
  strategy: LabwareMovementStrategy
}

export interface CommentArgs extends CommonArgs {
  commandCreatorFnName: 'comment'
  message: string
}

export interface CaptureImageArgs extends CommonArgs {
  commandCreatorFnName: 'captureImage'
  homeBefore: boolean
  fileName: string
  resolution: [Width, Height]
  zoom: number
  contrast: number
  brightness: number
  saturation: number
}

export interface FlexStackerEmptyArgs extends CommonArgs {
  moduleId: string
  commandCreatorFnName: 'flexStackerEmpty'
  interventionMessage: string | null
}
export interface FlexStackerFillItemsArgs extends CommonArgs {
  moduleId: string
  commandCreatorFnName: 'flexStackerFillItems'
  fillLabwareUri: string | null
  fillLabwareIds: string[]
  interventionMessage: string | null
}
export interface FlexStackerStoreArgs extends CommonArgs {
  moduleId: string
  commandCreatorFnName: 'flexStackerStore'
}
export interface FlexStackerRetrieveArgs extends CommonArgs {
  moduleId: string
  commandCreatorFnName: 'flexStackerRetrieve'
}

export interface VacuumPumpAdvancedArgs {
  duration?: number
  ventAfter?: boolean
}

export interface VacuumPumpPressureArgs
  extends CommonArgs, VacuumPumpAdvancedArgs {
  moduleId: string
  commandCreatorFnName: 'vacuumSetPumpPressure'
  gaugePressure: number
}

export interface VacuumPumpPowerArgs
  extends CommonArgs, VacuumPumpAdvancedArgs {
  moduleId: string
  commandCreatorFnName: 'vacuumSetPumpPower'
  powerPercent: number
}

export interface VacuumOpenVentArgs extends CommonArgs {
  moduleId: string
  commandCreatorFnName: 'vacuumOpenVent'
}

export interface VacuumCloseVentArgs extends CommonArgs {
  moduleId: string
  commandCreatorFnName: 'vacuumCloseVent'
}

export interface VacuumStopPumpArgs extends CommonArgs {
  moduleId: string
  commandCreatorFnName: 'vacuumStopPump'
}

export interface VacuumPressureData {
  mode: typeof VACUUM_MODE_PRESSURE
  pressureMbar: string | null
}

export interface VacuumPowerData {
  mode: typeof VACUUM_MODE_POWER
  powerPercent: number
}

type VacuumPumpData = VacuumPressureData | VacuumPowerData
interface ProfileStepItemBase {
  type: typeof PROFILE_STEP
  id: string
  title: string
}
export interface VacuumProfileStep extends ProfileStepItemBase {
  durationSeconds: number
  pumpData: VacuumPumpData
}

export type VacuumProfileItem = VacuumProfileStepItem | VacuumProfileCycleItem

export type VacuumPumpArgs = VacuumPumpPressureArgs | VacuumPumpPowerArgs

export interface VacuumStartRunProfileArgs extends CommonArgs {
  moduleId: string
  commandCreatorFnName: 'vacuumStartRunProfile'
  profile: VacuumRunProfileParams['profile']
  ventAfter?: boolean
}

export type VacuumArgs =
  | VacuumPumpArgs
  | VacuumStartRunProfileArgs
  | VacuumOpenVentArgs
  | VacuumCloseVentArgs
  | VacuumStopPumpArgs

export type FlexStackerArgs =
  | FlexStackerEmptyArgs
  | FlexStackerFillItemsArgs
  | FlexStackerRetrieveArgs
  | FlexStackerStoreArgs

export type CommandCreatorArgs =
  | AbsorbanceReaderInitializeArgs
  | AbsorbanceReaderReadArgs
  | AbsorbanceReaderLidArgs
  | ConsolidateArgs
  | CaptureImageArgs
  | DistributeArgs
  | MixArgs
  | PauseArgs
  | WaitForModuleTaskArgs
  | TransferArgs
  | EngageMagnetArgs
  | DisengageMagnetArgs
  | SetTemperatureArgs
  | WaitForTemperatureArgs
  | DeactivateTemperatureArgs
  | ThermocyclerProfileStepArgs
  | ThermocyclerStateStepArgs
  | HeaterShakerArgs
  | MoveLabwareArgs
  | CommentArgs
  | FlexStackerArgs
  | VacuumArgs

export interface LocationLiquidState {
  [ingredGroup: string]: { volume: number }
}

export interface SingleLabwareLiquidState {
  [well: string]: LocationLiquidState
}

export interface LabwareLiquidState {
  [labwareId: string]: SingleLabwareLiquidState
}

export interface SourceAndDest {
  source: LocationLiquidState
  dest: LocationLiquidState
}

// Data that never changes across time
export interface Config {
  OT_PD_DISABLE_MODULE_RESTRICTIONS: boolean
}
export interface InvariantContext {
  labwareEntities: LabwareEntities
  moduleEntities: ModuleEntities
  pipetteEntities: PipetteEntities
  wasteChuteEntities: WasteChuteEntities
  trashBinEntities: TrashBinEntities
  stagingAreaEntities: StagingAreaEntities
  gripperEntities: GripperEntities
  liquidEntities: LiquidEntities
  config: Config
}

export type TipState = typeof CLEAN | typeof DIRTY | typeof EMPTY
export interface TimelineFrame {
  pipettes: {
    [pipetteId: string]: PipetteTemporalProperties
  }
  labware: {
    [labwareId: string]: LabwareTemporalProperties
  }
  modules: {
    [moduleId: string]: ModuleTemporalProperties
  }
  tipState: {
    tipracks: {
      [labwareId: string]: {
        [wellName: string]: TipState
      }
    }
    pipettes: {
      [pipetteId: string]: {
        hasTip: boolean
        /** TODO: tiprackURI is a misnomer: it's a labwareId, not a URI */
        tiprackURI: string | null
      }
    }
  }
  liquidState: {
    pipettes: {
      [pipetteId: string]: {
        /** tips are numbered 0-7. 0 is the furthest to the back of the robot.
         * For an 8-channel, on a 96-flat, Tip 0 is in row A, Tip 7 is in row H.
         */
        [tipId: string]: LocationLiquidState
      }
    }
    labware: {
      [labwareId: string]: {
        [well: string]: LocationLiquidState
      }
    }
    trashBins: {
      [trashBinId: string]: LocationLiquidState
    }
    wasteChute: {
      [wasteChuteId: string]: LocationLiquidState
    }
  }
}
export type RobotState = TimelineFrame // legacy name alias

export type ErrorType =
  | 'ABSORBANCE_READER_LID_CLOSED'
  | 'ABSORBANCE_READER_NO_GRIPPER'
  | 'ABSORBANCE_READER_NO_INITIALIZATION'
  | 'CANNOT_MOVE_WITH_GRIPPER'
  | 'CLOSING_THERMOCYCLER_WITH_INVALID_LABWARE_LID'
  | 'DROP_TIP_LOCATION_DOES_NOT_EXIST'
  | 'EQUIPMENT_DOES_NOT_EXIST'
  | 'FLEX_STACKER_NO_GRIPPER'
  | 'GRIPPER_REQUIRED'
  | 'HEATER_SHAKER_EAST_WEST_LATCH_OPEN'
  | 'HEATER_SHAKER_EAST_WEST_MULTI_CHANNEL'
  | 'HEATER_SHAKER_IS_SHAKING'
  | 'HEATER_SHAKER_LATCH_CLOSED'
  | 'HEATER_SHAKER_LATCH_OPEN'
  | 'HEATER_SHAKER_NORTH_SOUTH__OF_NON_TIPRACK_WITH_MULTI_CHANNEL'
  | 'HEATER_SHAKER_NORTH_SOUTH_EAST_WEST_SHAKING'
  | 'HOPPER_EMPTY'
  | 'HOPPER_FULL'
  | 'INCOMPLETE_PICKUP'
  | 'INSUFFICIENT_TIPS'
  | 'INVALID_SLOT'
  | 'INVALID_WAIT_CONDITION'
  | 'LABWARE_DISCARDED_IN_TRASH'
  | 'LABWARE_DOES_NOT_EXIST'
  | 'LABWARE_OFF_DECK'
  | 'LABWARE_ON_ANOTHER_ENTITY'
  | 'LABWARE_ON_HOPPER'
  | 'LIVE_TASK_ERROR'
  | 'MISMATCHED_SOURCE_DEST_WELLS'
  | 'MISMATCHED_STACKER_LABWARE_TYPE'
  | 'MISSING_96_CHANNEL_TIPRACK_ADAPTER'
  | 'MISSING_MODULE'
  | 'MISSING_PROFILE_STEP'
  | 'MISSING_PUMP_ACTIVITY'
  | 'MISSING_STACKER_LABWARE_TYPE'
  | 'MISSING_TEMPERATURE_STEP'
  | 'MOVE_LOCATION_NOT_SPECIFIED'
  | 'MODULE_PIPETTE_COLLISION_DANGER'
  | 'MULTI_ASPIRATE_VOLUME_TOO_HIGH'
  | 'MULTI_DISPENSE_VOLUME_TOO_HIGH'
  | 'NEXT_TIPRACK_HAS_LID'
  | 'NO_TIP_ON_PIPETTE'
  | 'NO_TIP_SELECTED'
  | 'PIPETTE_DOES_NOT_EXIST'
  | 'PIPETTE_HAS_TIP'
  | 'PIPETTE_VOLUME_EXCEEDED'
  | 'PIPETTING_INTO_COLUMN_4'
  | 'POSSIBLE_PIPETTE_COLLISION_THERMOCYCLER_LID'
  | 'POSSIBLE_PIPETTE_COLLISION_OUTSIDE_DECK_EXTENTS'
  | 'POSSIBLE_PIPETTE_COLLISION_ADJACENT_ADDRESSABLE_AREA'
  | 'REMOVE_96_CHANNEL_TIPRACK_ADAPTER'
  | 'RETRACT_BELOW_ASPIRATE'
  | 'RETRACT_BELOW_DISPENSE'
  | 'RETURN_TIP_UNAVAILABLE'
  | 'SHUTTLE_FULL'
  | 'SHUTTLE_EMPTY'
  | 'STACK_TOO_HIGH'
  | 'SUBMERGE_BELOW_ASPIRATE'
  | 'SUBMERGE_BELOW_DISPENSE'
  | 'TALL_LABWARE_EAST_WEST_OF_HEATER_SHAKER'
  | 'THERMOCYCLER_BUSY_WITH_PROFILE'
  | 'THERMOCYCLER_LID_CLOSED'
  | 'TIP_VOLUME_EXCEEDED'
  | 'TIPRACK_LID_NOT_ALLOWED_ON_DECK'
  | 'TOO_MANY_TIPS'

export interface CommandCreatorError {
  message: string
  type: ErrorType
  translationParams?: Record<string, string>
}

export type WarningType =
  | 'ASPIRATE_MORE_THAN_WELL_CONTENTS'
  | 'ASPIRATE_FROM_PRISTINE_WELL'
  | 'LABWARE_IN_WASTE_CHUTE_HAS_LIQUID'
  | 'TIPRACK_IN_WASTE_CHUTE_HAS_TIPS'
  | 'TEMPERATURE_IS_POTENTIALLY_UNREACHABLE'
  | 'WAITING_FOR_NONEXISTENT_TASK'

export interface CommandCreatorWarning {
  message: string
  type: WarningType
}

interface StepInfo {
  stepNumber?: number
  name?: string | null
  description?: string | null
}

export interface CommandsAndRobotState {
  commands: CreateCommand[]
  robotState: RobotState
  stepInfo?: StepInfo
  warnings?: CommandCreatorWarning[]
  python?: string
}

export interface CommandCreatorErrorResponse {
  errors: CommandCreatorError[]
  warnings?: CommandCreatorWarning[]
}

export interface CommandsAndWarnings extends StepInfo {
  commands: CreateCommand[]
  warnings?: CommandCreatorWarning[]
  python?: string
}
export type CommandCreatorResult =
  | CommandsAndWarnings
  | CommandCreatorErrorResponse
export type CommandCreator<Args> = (
  args: Args,
  invariantContext: InvariantContext,
  prevRobotState: RobotState
) => CommandCreatorResult
export type CurriedCommandCreator = (
  invariantContext: InvariantContext,
  prevRobotState: RobotState
) => CommandCreatorResult

export interface Timeline {
  timeline: CommandsAndRobotState[] // TODO: Ian 2018-06-14 avoid timeline.timeline shape, better names
  errors?: CommandCreatorError[] | null
}

export interface RobotStateAndWarnings {
  robotState: RobotState
  warnings: CommandCreatorWarning[]
}
export interface WellContents {
  // eg 'A1', 'A2' etc
  wellName?: string
  groupIds: string[]
  ingreds: LocationLiquidState
  highlighted?: boolean
  selected?: boolean
  maxVolume?: number
}

export interface WellContentsByNumber {
  [wellName: string]: number
}

export type TipTrackingOption = typeof AUTOMATIC | typeof MANUAL

export type UnsafePipetteMovementReason =
  | {
      type: 'thermocyclerLidCollision'
    }
  | {
      type: 'outsidePipetteExtents'
    }
  | {
      type: 'adjacentAdressableAreaCollision'
      addressableAreaCausingCollision: AddressableArea
    }

export type PipetteMovementSafetyStatus =
  | { isSafe: true }
  | { isSafe: false; reason: UnsafePipetteMovementReason }
