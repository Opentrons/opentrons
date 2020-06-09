// @flow
import type {
  AtomicProfileStep,
  Command,
  EngageMagnetParams,
  ModuleOnlyParams,
} from '@opentrons/shared-data/protocol/flowTypes/schemaV4'
import typeof { THERMOCYCLER_STATE, THERMOCYCLER_PROFILE } from '../constants'
import type {
  LabwareTemporalProperties,
  ModuleTemporalProperties,
  PipetteTemporalProperties,
  LabwareEntities,
  ModuleEntities,
  PipetteEntities,
} from '../step-forms'

// ===== MIX-IN TYPES =====

export type ChangeTipOptions =
  | 'always'
  | 'once'
  | 'never'
  | 'perDest'
  | 'perSource'

export type InnerMixArgs = {|
  volume: number,
  times: number,
|}

type CommonArgs = {|
  /** Optional user-readable name for this step */
  name: ?string,
  /** Optional user-readable description/notes for this step */
  description: ?string,
|}

// ===== Processed form types. Used as args to call command creator fns =====

export type SharedTransferLikeArgs = {
  ...CommonArgs,

  pipette: string, // PipetteId

  sourceLabware: string,
  destLabware: string,
  /** volume is interpreted differently by different Step types */
  volume: number,

  // ===== ASPIRATE SETTINGS =====
  /** Pre-wet tip with ??? uL liquid from the first source well. */
  preWetTip: boolean,
  /** Touch tip after every aspirate */
  touchTipAfterAspirate: boolean,
  /** Optional offset for touch tip after aspirate (if null, use PD default) */
  touchTipAfterAspirateOffsetMmFromBottom: number,
  /** changeTip is interpreted differently by different Step types */
  changeTip: ChangeTipOptions,
  /** Flow rate in uL/sec for all aspirates */
  aspirateFlowRateUlSec: number,
  /** offset from bottom of well in mm */
  aspirateOffsetFromBottomMm: number,

  // ===== DISPENSE SETTINGS =====
  /** Touch tip in destination well after dispense */
  touchTipAfterDispense: boolean,
  /** Optional offset for touch tip after dispense (if null, use PD default) */
  touchTipAfterDispenseOffsetMmFromBottom: number,
  /** Flow rate in uL/sec for all dispenses */
  dispenseFlowRateUlSec: number,
  /** offset from bottom of well in mm */
  dispenseOffsetFromBottomMm: number,
}

export type ConsolidateArgs = {
  commandCreatorFnName: 'consolidate',

  sourceWells: Array<string>,
  destWell: string,

  /** If given, blow out in the specified destination after dispense at the end of each asp-asp-dispense cycle */
  blowoutLocation: ?string,
  blowoutFlowRateUlSec: number,
  blowoutOffsetFromTopMm: number,

  /** Mix in first well in chunk */
  mixFirstAspirate: ?InnerMixArgs,
  /** Mix in destination well after dispense */
  mixInDestination: ?InnerMixArgs,
} & SharedTransferLikeArgs

export type TransferArgs = {
  commandCreatorFnName: 'transfer',

  sourceWells: Array<string>,
  destWells: Array<string>,

  /** If given, blow out in the specified destination after dispense at the end of each asp-dispense cycle */
  blowoutLocation: ?string,
  blowoutFlowRateUlSec: number,
  blowoutOffsetFromTopMm: number,

  /** Mix in first well in chunk */
  mixBeforeAspirate: ?InnerMixArgs,
  /** Mix in destination well after dispense */
  mixInDestination: ?InnerMixArgs,
} & SharedTransferLikeArgs

export type DistributeArgs = {
  commandCreatorFnName: 'distribute',

  sourceWell: string,
  destWells: Array<string>,

  /** Disposal volume is added to the volume of the first aspirate of each asp-asp-disp cycle */
  disposalVolume: ?number,
  /** Disposal labware and well for final blowout destination of disposalVolume contents (e.g. trash, source well, etc.) */
  disposalLabware: ?string,
  disposalWell: ?string,

  /** pass to blowout **/
  blowoutFlowRateUlSec: number,
  blowoutOffsetFromTopMm: number,

  /** Mix in first well in chunk */
  mixBeforeAspirate: ?InnerMixArgs,
} & SharedTransferLikeArgs

export type MixArgs = {
  ...$Exact<CommonArgs>,
  commandCreatorFnName: 'mix',
  labware: string,
  pipette: string,
  wells: Array<string>,
  /** Mix volume (should not exceed pipette max) */
  volume: number,
  /** Times to mix (should be integer) */
  times: number,
  /** Touch tip after mixing */
  touchTip: boolean,
  touchTipMmFromBottom: number,
  /** change tip: see comments in step-generation/mix.js */
  changeTip: ChangeTipOptions,

  /** If given, blow out in the specified destination after mixing each well */
  blowoutLocation: ?string,
  blowoutFlowRateUlSec: number,
  blowoutOffsetFromTopMm: number,

  /** offset from bottom of well in mm */
  aspirateOffsetFromBottomMm: number,
  dispenseOffsetFromBottomMm: number,
  /** flow rates in uL/sec */
  aspirateFlowRateUlSec: number,
  dispenseFlowRateUlSec: number,
}

export type PauseArgs = {|
  ...$Exact<CommonArgs>,
  commandCreatorFnName: 'delay',
  message?: string,
  wait: number | true,
  pauseTemperature?: number | null,
  meta: ?{|
    hours?: number,
    minutes?: number,
    seconds?: number,
  |},
|}

export type AwaitTemperatureArgs = {|
  module: string | null,
  commandCreatorFnName: 'awaitTemperature',
  temperature: number,
  message?: string,
|}

export type EngageMagnetArgs = {|
  ...EngageMagnetParams,
  module: string | null,
  commandCreatorFnName: 'engageMagnet',
  message?: string,
|}

export type DisengageMagnetArgs = {|
  ...ModuleOnlyParams,
  module: string | null,
  commandCreatorFnName: 'disengageMagnet',
  message?: string,
|}

export type SetTemperatureArgs = {|
  module: string | null,
  commandCreatorFnName: 'setTemperature',
  targetTemperature: number,
  message?: string,
|}

export type DeactivateTemperatureArgs = {|
  module: string | null,
  commandCreatorFnName: 'deactivateTemperature',
  message?: string,
|}

export type ThermocyclerProfileStepArgs = {|
  module: string,
  commandCreatorFnName: THERMOCYCLER_PROFILE,
  blockTargetTempHold: number | null,
  lidOpenHold: boolean,
  lidTargetTempHold: number | null,
  message?: string,
  profileSteps: Array<AtomicProfileStep>,
  profileTargetLidTemp: number | null,
  profileVolume: number,
|}

export type ThermocyclerStateStepArgs = {|
  module: string,
  commandCreatorFnName: THERMOCYCLER_STATE,
  blockTargetTemp: number | null,
  lidTargetTemp: number | null,
  lidOpen: boolean,
  message?: string,
|}

export type CommandCreatorArgs =
  | ConsolidateArgs
  | DistributeArgs
  | MixArgs
  | PauseArgs
  | TransferArgs
  | EngageMagnetArgs
  | DisengageMagnetArgs
  | SetTemperatureArgs
  | AwaitTemperatureArgs
  | DeactivateTemperatureArgs
  | ThermocyclerProfileStepArgs
  | ThermocyclerStateStepArgs

/** tips are numbered 0-7. 0 is the furthest to the back of the robot.
 * For an 8-channel, on a 96-flat, Tip 0 is in row A, Tip 7 is in row H.
 */
type TipId = string

export type LocationLiquidState = {
  [ingredGroup: string]: {| volume: number |},
}

export type SingleLabwareLiquidState = { [well: string]: LocationLiquidState }

export type LabwareLiquidState = {
  [labwareId: string]: SingleLabwareLiquidState,
}

export type SourceAndDest = {|
  source: LocationLiquidState,
  dest: LocationLiquidState,
|}

// Data that never changes across time
export type InvariantContext = {|
  labwareEntities: LabwareEntities,
  moduleEntities: ModuleEntities,
  pipetteEntities: PipetteEntities,
|}

// TODO Ian 2018-02-09 Rename this so it's less ambigious with what we call "robot state": `TimelineFrame`?
export type RobotState = {|
  pipettes: {
    [pipetteId: string]: PipetteTemporalProperties,
  },
  labware: {
    [labwareId: string]: LabwareTemporalProperties,
  },
  modules: {
    [moduleId: string]: ModuleTemporalProperties,
  },
  tipState: {
    tipracks: {
      [labwareId: string]: {
        [wellName: string]: boolean, // true if tip is in there
      },
    },
    pipettes: {
      [pipetteId: string]: boolean, // true if pipette has tip(s)
    },
  },
  liquidState: {
    pipettes: {
      [pipetteId: string]: {
        [tipId: TipId]: LocationLiquidState,
      },
    },
    labware: {
      [labwareId: string]: {
        [well: string]: LocationLiquidState,
      },
    },
  },
|}

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

export type CommandCreatorError = {|
  message: string,
  type: ErrorType,
|}

export type WarningType =
  | 'ASPIRATE_MORE_THAN_WELL_CONTENTS'
  | 'ASPIRATE_FROM_PRISTINE_WELL'

export type CommandCreatorWarning = {|
  message: string,
  type: WarningType,
|}

export type CommandsAndRobotState = {|
  commands: Array<Command>,
  robotState: RobotState,
  warnings?: Array<CommandCreatorWarning>,
|}

export type CommandCreatorErrorResponse = {
  errors: Array<CommandCreatorError>,
  warnings?: Array<CommandCreatorWarning>,
}

export type CommandsAndWarnings = {|
  commands: Array<Command>,
  warnings?: Array<CommandCreatorWarning>,
|}
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

export type Timeline = {|
  timeline: Array<CommandsAndRobotState>, // TODO: Ian 2018-06-14 avoid timeline.timeline shape, better names
  errors?: ?Array<CommandCreatorError>,
|}

export type RobotStateAndWarnings = {|
  robotState: RobotState,
  warnings: Array<CommandCreatorWarning>,
|}
