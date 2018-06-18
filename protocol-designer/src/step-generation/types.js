// @flow
import type {DeckSlot, Mount, Channels} from '@opentrons/components'

// ===== MIX-IN TYPES =====

export type ChangeTipOptions = 'always' | 'once' | 'never'

export type MixArgs = {|
  volume: number,
  times: number
|}

export type SharedFormDataFields = {|
  /** Optional user-readable name for this step */
  name: ?string,
  /** Optional user-readable description/notes for this step */
  description: ?string,
|}

// ===== Processed form types. Used as args to call command creator fns =====

export type TransferLikeFormDataFields = {
  ...SharedFormDataFields,

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
  /** changeTip is interpreted differently by different Step types */
  changeTip: ChangeTipOptions,
  /** Disposal volume is added to the volume of the first aspirate of each asp-asp-disp cycle */
  disposalVolume: ?number,

  // ===== DISPENSE SETTINGS =====
  /** Touch tip in destination well after dispense */
  touchTipAfterDispense: boolean,
  /** Number of seconds to delay at the very end of the step (TODO: or after each dispense ?) */
  delayAfterDispense: ?number,
  /** If given, blow out in the specified labware after dispense at the end of each asp-asp-dispense cycle */
  blowout: ?string // TODO LATER LabwareId export type here instead of string?
}

export type ConsolidateFormData = {
  stepType: 'consolidate',

  sourceWells: Array<string>,
  destWell: string,

  /** Mix in first well in chunk */
  mixFirstAspirate: ?MixArgs,
  /** Mix in destination well after dispense */
  mixInDestination: ?MixArgs
} & TransferLikeFormDataFields

export type TransferFormData = {
  stepType: 'transfer',

  sourceWells: Array<string>,
  destWells: Array<string>,

  /** Mix in first well in chunk */
  mixBeforeAspirate: ?MixArgs,
  /** Mix in destination well after dispense */
  mixInDestination: ?MixArgs
} & TransferLikeFormDataFields

export type DistributeFormData = {
  stepType: 'distribute',

  sourceWell: string,
  destWells: Array<string>,

  /** Mix in first well in chunk */
  mixBeforeAspirate: ?MixArgs
} & TransferLikeFormDataFields

export type MixFormData = {
  ...SharedFormDataFields,
  stepType: 'mix',
  labware: string,
  pipette: string,
  wells: Array<string>,
  /** Mix volume (should not exceed pipette max) */
  volume: number,
  /** Times to mix (should be integer) */
  times: number,
  /** Touch tip after mixing */
  touchTip: boolean,
  /** Delay in seconds */
  delay: ?number,
  /** change tip: see comments in step-generation/mix.js */
  changeTip: ChangeTipOptions,
  /** If given, blow out in the specified labware after mixing each well */
  blowout?: string
}

export type PauseFormData = {|
  ...SharedFormDataFields,
  stepType: 'pause',
  message?: string,
  wait: number | true,
  meta: ?{
    hours?: number,
    minutes?: number,
    seconds?: number
  }
|}

export type CommandCreatorData =
  | ConsolidateFormData
  | DistributeFormData
  | MixFormData
  | PauseFormData
  | TransferFormData

export type PipetteData = {| // TODO refactor all 'pipette fields', split PipetteData into its own export type
  id: string, // TODO PipetteId export type here instead of string?
  mount: Mount,
  maxVolume: number,
  channels: Channels
|}

export type LabwareData = {|
  type: string, // TODO Ian 2018-04-17 keys from JSON. Also, rename 'type' to 'model' (or something??)
  name: ?string, // user-defined nickname
  slot: DeckSlot
|}

/** tips are numbered 0-7. 0 is the furthest to the back of the robot.
  * For an 8-channel, on a 96-flat, Tip 0 is in row A, Tip 7 is in row H.
  */
type TipId = string

export type LocationLiquidState = {[ingredGroup: string]: {volume: number}}

export type SingleLabwareLiquidState = {[well: string]: LocationLiquidState}

export type LabwareLiquidState = {[labwareId: string]: SingleLabwareLiquidState}

// TODO Ian 2018-02-09 Rename this so it's less ambigious with what we call "robot state": RobotSimulationState?
export type RobotState = {|
  instruments: { // TODO Ian 2018-05-23 rename this 'pipettes' to match tipState (& to disambiguate from future 'modules')
    [instrumentId: string]: PipetteData
  },
  labware: {
    [labwareId: string]: LabwareData
  },
  tipState: {
    tipracks: {
      [labwareId: string]: {
        [wellName: string]: boolean // true if tip is in there
      }
    },
    pipettes: {
      [pipetteId: string]: boolean // true if tip is on pipette
    }
  },
  liquidState: {
    pipettes: {
      [pipetteId: string]: {
        [tipId: TipId]: LocationLiquidState
      }
    },
    labware: {
      [labwareId: string]: {
        [well: string]: LocationLiquidState
      }
    }
  }
|}

export type PipetteLabwareFields = {|
  pipette: string,
  labware: string,
  well: string
  /* TODO optional uL/sec (or uL/minute???) speed here */
|}

export type AspirateDispenseArgs = {|
  ...PipetteLabwareFields,
  volume: number
|}

export type Command = {|
  command: 'aspirate' | 'dispense',
  params: AspirateDispenseArgs
|} | {|
  command: 'pick-up-tip' | 'drop-tip' | 'blowout' | 'touch-tip',
  params: PipetteLabwareFields
|} | {|
  command: 'delay',
  /** number of seconds to delay (fractional values OK),
    or `true` for delay until user input */
  params: {|
    wait: number | true,
    message: ?string
  |}
|} | {|
  command: 'air-gap',
  params: {|
    pipette: string,
    volume: number
  |},
|}

export type ErrorType =
  | 'INSUFFICIENT_TIPS'
  | 'MISMATCHED_SOURCE_DEST_WELLS'
  | 'LABWARE_DOES_NOT_EXIST'
  | 'PIPETTE_DOES_NOT_EXIST'
  | 'NO_TIP_ON_PIPETTE'
  | 'PIPETTE_VOLUME_EXCEEDED'

export type CommandCreatorError = {|
  message: string,
  type: ErrorType
|}

export type WarningType =
  | 'ASPIRATE_MORE_THAN_WELL_CONTENTS'

export type CommandCreatorWarning = {|
    message: string,
    type: WarningType
|}

export type CommandsAndRobotState = {|
  commands: Array<Command>,
  robotState: RobotState,
  warnings?: Array<CommandCreatorWarning>
|}

export type CommandCreatorErrorResponse = {
  errors: Array<CommandCreatorError>,
  warnings?: Array<CommandCreatorWarning>
}

export type CommandCreator = (prevRobotState: RobotState) => CommandsAndRobotState | CommandCreatorErrorResponse

export type Timeline = {|
  timeline: Array<CommandsAndRobotState>, // TODO: Ian 2018-06-14 avoid timeline.timeline shape, better names
  errors?: ?Array<CommandCreatorError>
|}
