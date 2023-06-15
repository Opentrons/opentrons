import type { Mount } from '@opentrons/components'
import {
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_BLOCK_TYPE,
  LabwareLocation,
} from '@opentrons/shared-data'
import type {
  CreateCommand,
  LabwareDefinition2,
  ModuleType,
  ModuleModel,
  PipetteNameSpecs,
  PipetteName,
} from '@opentrons/shared-data'
import type {
  AtomicProfileStep,
  EngageMagnetParams,
  ModuleOnlyParams,
} from '@opentrons/shared-data/protocol/types/schemaV4'
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV5Addendum'
import type {
  TEMPERATURE_DEACTIVATED,
  TEMPERATURE_AT_TARGET,
  TEMPERATURE_APPROACHING_TARGET,
} from './constants'
import { ShakeSpeedParams } from '@opentrons/shared-data/protocol/types/schemaV6/command/module'

export type { Command }

// Copied from PD
export type DeckSlot = string
type THERMOCYCLER_STATE = 'thermocyclerState'
type THERMOCYCLER_PROFILE = 'thermocyclerProfile'
export interface LabwareTemporalProperties {
  slot: DeckSlot
}

export interface PipetteTemporalProperties {
  mount: Mount
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
export interface ThermocyclerModuleState {
  type: typeof THERMOCYCLER_MODULE_TYPE
  blockTargetTemp: number | null // null means block is deactivated
  lidTargetTemp: number | null // null means lid is deactivated
  lidOpen: boolean | null // if false, closed. If null, unknown
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
export interface ModuleTemporalProperties {
  slot: DeckSlot
  moduleState:
    | MagneticModuleState
    | TemperatureModuleState
    | ThermocyclerModuleState
    | HeaterShakerModuleState
    | MagneticBlockState
}

export interface LabwareEntity {
  id: string
  labwareDefURI: string
  def: LabwareDefinition2
}
export interface LabwareEntities {
  [labwareId: string]: LabwareEntity
}

export interface ModuleEntity {
  id: string
  type: ModuleType
  model: ModuleModel
}

export interface ModuleEntities {
  [moduleId: string]: ModuleEntity
}

export interface NormalizedPipetteById {
  [pipetteId: string]: {
    name: PipetteName
    id: string
    tiprackDefURI: string
  }
}

export type NormalizedPipette = NormalizedPipetteById[keyof NormalizedPipetteById]

// "entities" have only properties that are time-invariant
// when they are de-normalized, the definitions they reference are baked in
// =========== PIPETTES ========
export type PipetteEntity = NormalizedPipette & {
  tiprackLabwareDef: LabwareDefinition2
  spec: PipetteNameSpecs
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

export interface InnerMixArgs {
  volume: number
  times: number
}

export interface InnerDelayArgs {
  seconds: number
  mmFromBottom: number
}

interface CommonArgs {
  /** Optional user-readable name for this step */
  name: string | null | undefined
  /** Optional user-readable description/notes for this step */
  description: string | null | undefined
}

// ===== Processed form types. Used as args to call command creator fns =====

export type SharedTransferLikeArgs = CommonArgs & {
  pipette: string // PipetteId

  sourceLabware: string
  destLabware: string
  /** volume is interpreted differently by different Step types */
  volume: number

  // ===== ASPIRATE SETTINGS =====
  /** Pre-wet tip with ??? uL liquid from the first source well. */
  preWetTip: boolean
  /** Touch tip after every aspirate */
  touchTipAfterAspirate: boolean
  /** Optional offset for touch tip after aspirate (if null, use PD default) */
  touchTipAfterAspirateOffsetMmFromBottom: number
  /** changeTip is interpreted differently by different Step types */
  changeTip: ChangeTipOptions
  /** Delay after every aspirate */
  aspirateDelay: InnerDelayArgs | null | undefined
  /** Air gap after every aspirate */
  aspirateAirGapVolume: number | null
  /** Flow rate in uL/sec for all aspirates */
  aspirateFlowRateUlSec: number
  /** offset from bottom of well in mm */
  aspirateOffsetFromBottomMm: number

  // ===== DISPENSE SETTINGS =====
  /** Air gap after dispense */
  dispenseAirGapVolume: number | null
  /** Delay after every dispense */
  dispenseDelay: InnerDelayArgs | null | undefined
  /** Touch tip in destination well after dispense */
  touchTipAfterDispense: boolean
  /** Optional offset for touch tip after dispense (if null, use PD default) */
  touchTipAfterDispenseOffsetMmFromBottom: number
  /** Flow rate in uL/sec for all dispenses */
  dispenseFlowRateUlSec: number
  /** offset from bottom of well in mm */
  dispenseOffsetFromBottomMm: number
}

export type ConsolidateArgs = SharedTransferLikeArgs & {
  commandCreatorFnName: 'consolidate'

  sourceWells: string[]
  destWell: string

  /** If given, blow out in the specified destination after dispense at the end of each asp-asp-dispense cycle */
  blowoutLocation: string | null | undefined
  blowoutFlowRateUlSec: number
  blowoutOffsetFromTopMm: number

  /** Mix in first well in chunk */
  mixFirstAspirate: InnerMixArgs | null | undefined
  /** Mix in destination well after dispense */
  mixInDestination: InnerMixArgs | null | undefined
}

export type TransferArgs = SharedTransferLikeArgs & {
  commandCreatorFnName: 'transfer'

  sourceWells: string[]
  destWells: string[]

  /** If given, blow out in the specified destination after dispense at the end of each asp-dispense cycle */
  blowoutLocation: string | null | undefined
  blowoutFlowRateUlSec: number
  blowoutOffsetFromTopMm: number

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
  /** pass to blowout **/
  /** If given, blow out in the specified destination after dispense at the end of each asp-dispense cycle */
  blowoutLocation: string | null | undefined
  blowoutFlowRateUlSec: number
  blowoutOffsetFromTopMm: number

  /** Mix in first well in chunk */
  mixBeforeAspirate: InnerMixArgs | null | undefined
}

export type MixArgs = CommonArgs & {
  commandCreatorFnName: 'mix'
  labware: string
  pipette: string
  wells: string[]
  /** Mix volume (should not exceed pipette max) */
  volume: number
  /** Times to mix (should be integer) */
  times: number
  /** Touch tip after mixing */
  touchTip: boolean
  touchTipMmFromBottom: number
  /** change tip: see comments in step-generation/mix.js */
  changeTip: ChangeTipOptions

  /** If given, blow out in the specified destination after mixing each well */
  blowoutLocation: string | null | undefined
  blowoutFlowRateUlSec: number
  blowoutOffsetFromTopMm: number

  /** offset from bottom of well in mm */
  aspirateOffsetFromBottomMm: number
  dispenseOffsetFromBottomMm: number
  /** flow rates in uL/sec */
  aspirateFlowRateUlSec: number
  dispenseFlowRateUlSec: number
  /** delays */
  aspirateDelaySeconds: number | null | undefined
  dispenseDelaySeconds: number | null | undefined
}

export type PauseArgs = CommonArgs & {
  commandCreatorFnName: 'delay'
  message?: string
  wait: number | true
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

export interface WaitForTemperatureArgs {
  module: string | null
  commandCreatorFnName: 'waitForTemperature'
  temperature: number
  message?: string
}

export type EngageMagnetArgs = EngageMagnetParams & {
  module: string
  commandCreatorFnName: 'engageMagnet'
  message?: string
}

export type DisengageMagnetArgs = ModuleOnlyParams & {
  module: string
  commandCreatorFnName: 'disengageMagnet'
  message?: string
}

export interface SetTemperatureArgs {
  module: string | null
  commandCreatorFnName: 'setTemperature'
  targetTemperature: number
  message?: string
}

export interface DeactivateTemperatureArgs {
  module: string | null
  commandCreatorFnName: 'deactivateTemperature'
  message?: string
}

export type SetShakeSpeedArgs = ShakeSpeedParams & {
  moduleId: string
  commandCreatorFnName: 'setShakeSpeed'
  message?: string
}

export interface HeaterShakerArgs {
  module: string | null
  rpm: number | null
  commandCreatorFnName: 'heaterShaker'
  targetTemperature: number | null
  latchOpen: boolean
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

// TODO IMMEDIATELY: ProfileStepItem -> ProfileStep, ProfileCycleItem -> ProfileCycle
export type ProfileItem = ProfileStepItem | ProfileCycleItem

export interface ThermocyclerProfileStepArgs {
  module: string
  commandCreatorFnName: THERMOCYCLER_PROFILE
  blockTargetTempHold: number | null
  lidOpenHold: boolean
  lidTargetTempHold: number | null
  message?: string
  profileSteps: AtomicProfileStep[]
  profileTargetLidTemp: number
  profileVolume: number
  meta?: {
    rawProfileItems: ProfileItem[]
  }
}

export interface ThermocyclerStateStepArgs {
  module: string
  commandCreatorFnName: THERMOCYCLER_STATE
  blockTargetTemp: number | null
  lidTargetTemp: number | null
  lidOpen: boolean
  message?: string
}

export interface MoveLabwareArgs extends CommonArgs {
  commandCreatorFnName: 'moveLabware'
  labware: string
  useGripper: boolean
  newLocation: LabwareLocation
}

export type CommandCreatorArgs =
  | ConsolidateArgs
  | DistributeArgs
  | MixArgs
  | PauseArgs
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
  config: Config
}

// TODO Ian 2018-02-09 Rename this so it's less ambigious with what we call "robot state": `TimelineFrame`?
export interface RobotState {
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
        [wellName: string]: boolean // true if tip is in there
      }
    }
    pipettes: {
      [pipetteId: string]: boolean // true if pipette has tip(s)
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
  }
}

export type ErrorType =
  | 'INSUFFICIENT_TIPS'
  | 'LABWARE_DOES_NOT_EXIST'
  | 'MISMATCHED_SOURCE_DEST_WELLS'
  | 'MISSING_MODULE'
  | 'MODULE_PIPETTE_COLLISION_DANGER'
  | 'NO_TIP_ON_PIPETTE'
  | 'PIPETTE_DOES_NOT_EXIST'
  | 'PIPETTE_VOLUME_EXCEEDED'
  | 'TIP_VOLUME_EXCEEDED'
  | 'MISSING_TEMPERATURE_STEP'
  | 'THERMOCYCLER_LID_CLOSED'
  | 'INVALID_SLOT'
  | 'HEATER_SHAKER_LATCH_OPEN'
  | 'HEATER_SHAKER_IS_SHAKING'
  | 'TALL_LABWARE_EAST_WEST_OF_HEATER_SHAKER'
  | 'HEATER_SHAKER_EAST_WEST_LATCH_OPEN'
  | 'HEATER_SHAKER_NORTH_SOUTH_EAST_WEST_SHAKING'
  | 'HEATER_SHAKER_EAST_WEST_MULTI_CHANNEL'
  | 'HEATER_SHAKER_NORTH_SOUTH__OF_NON_TIPRACK_WITH_MULTI_CHANNEL'

export interface CommandCreatorError {
  message: string
  type: ErrorType
}

export type WarningType =
  | 'ASPIRATE_MORE_THAN_WELL_CONTENTS'
  | 'ASPIRATE_FROM_PRISTINE_WELL'

export interface CommandCreatorWarning {
  message: string
  type: WarningType
}

export interface CommandsAndRobotState {
  commands: CreateCommand[]
  robotState: RobotState
  warnings?: CommandCreatorWarning[]
}

export interface CommandCreatorErrorResponse {
  errors: CommandCreatorError[]
  warnings?: CommandCreatorWarning[]
}

export interface CommandsAndWarnings {
  commands: CreateCommand[]
  warnings?: CommandCreatorWarning[]
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

// Copied from PD
export type WellOrderOption = 'l2r' | 'r2l' | 't2b' | 'b2t'
