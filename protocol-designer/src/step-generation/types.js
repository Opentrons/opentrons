// @flow
import type {DeckSlot, Mount, Channels} from '@opentrons/components'
import type {MixArgs, SharedFormDataFields, ChangeTipOptions} from '../form-types'

export type ConsolidateFormData = {|
  ...SharedFormDataFields,

  stepType: 'consolidate',

  pipette: string, // PipetteId. TODO IMMEDIATELY/SOON make this match in the form

  sourceWells: Array<string>,
  destWell: string,

  sourceLabware: string,
  destLabware: string,
  /** Volume to aspirate from each source well. Different volumes across the
    source wells isn't currently supported
  */
  volume: number,

  // ===== ASPIRATE SETTINGS =====
  /** Pre-wet tip with ??? uL liquid from the first source well. */
  preWetTip: boolean,
  /** Touch tip after every aspirate */
  touchTipAfterAspirate: boolean,
  /**
    For consolidate, changeTip means:
    'always': before the first aspirate in a single asp-asp-disp cycle, get a fresh tip
    'once': get a new tip at the beginning of the consolidate step, and use it throughout
    'never': reuse the tip from the last step
  */
  changeTip: ChangeTipOptions,
  /** Mix in first well in chunk */
  mixFirstAspirate: ?MixArgs,
  /** Disposal volume is added to the volume of the first aspirate of each asp-asp-disp cycle */
  disposalVolume: ?number,

  // ===== DISPENSE SETTINGS =====
  /** Mix in destination well after dispense */
  mixInDestination: ?MixArgs,
  /** Touch tip in destination well after dispense */
  touchTipAfterDispense: boolean,
  /** Number of seconds to delay at the very end of the step (TODO: or after each dispense ?) */
  delayAfterDispense: ?number,
  /** If given, blow out in the specified labware after dispense at the end of each asp-asp-dispense cycle */
  blowout: ?string // TODO LATER LabwareId export type here instead of string?
|}

export type TransferFormData = {|
  // TODO IMMEDIATELY use "mixin types" for shared fields across FormData types.
  ...SharedFormDataFields,
  stepType: 'transfer',

  pipette: string, // PipetteId. TODO IMMEDIATELY/SOON make this match in the form

  sourceWells: Array<string>,
  destWells: Array<string>,

  sourceLabware: string,
  destLabware: string,
  /** Volume to aspirate from each source well. Different volumes across the
    source wells isn't currently supported
  */
  volume: number,

  // ===== ASPIRATE SETTINGS =====
  /** Pre-wet tip with ??? uL liquid from the first source well. */
  preWetTip: boolean,
  /** Touch tip after every aspirate */
  touchTipAfterAspirate: boolean,
  /**
    For transfer, changeTip means:
    'always': before each aspirate, get a fresh tip
    'once': get a new tip at the beginning of the transfer step, and use it throughout
    'never': reuse the tip from the last step
  */
  changeTip: ChangeTipOptions,
  /** Mix in first well in chunk */
  mixBeforeAspirate: ?MixArgs,
  /** Disposal volume is added to the volume of the first aspirate of each asp-asp-disp cycle */
  disposalVolume: ?number,

  // ===== DISPENSE SETTINGS =====
  /** Mix in destination well after dispense */
  mixInDestination: ?MixArgs,
  /** Touch tip in destination well after dispense */
  touchTipAfterDispense: boolean,
  /** Number of seconds to delay at the very end of the step (TODO: or after each dispense ?) */
  delayAfterDispense: ?number,
  /** If given, blow out in the specified labware after dispense at the end of each asp-asp-dispense cycle */
  blowout: ?string // TODO LATER LabwareId export type here instead of string?
|}

export type PipetteData = {| // TODO refactor all 'pipette fields', split PipetteData into its own export type
  id: string, // TODO PipetteId export type here instead of string?
  mount: Mount,
  maxVolume: number,
  channels: Channels
|}

export type LabwareData = {
  type: string, // TODO LATER keys from JSON
  name: ?string, // user-defined nickname
  slot: DeckSlot
}

/** tips are numbered 0-7. 0 is the furthest to the back of the robot.
  * For an 8-channel, on a 96-flat, Tip 0 is in row A, Tip 7 is in row H.
  */
type TipId = string

export type LocationLiquidState = {[ingredGroup: string]: {volume: number}}

// TODO Ian 2018-02-09 Rename this so it's less ambigious with what we call "robot state": RobotSimulationState?
export type RobotState = {|
  instruments: {
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
  ...AspirateDispenseArgs
|} | {|
  command: 'pick-up-tip' | 'drop-tip' | 'blowout' | 'touch-tip',
  ...PipetteLabwareFields
|} | {|
  command: 'delay',
  /** number of seconds to delay (fractional values OK),
    or `true` for delay until user input */
  wait: number | true,
  message: ?string
|} | {|
  command: 'air-gap',
  pipette: string,
  volume: number
|}

export type CommandCreator = (prevRobotState: RobotState) => {|
  commands: Array<Command>,
  robotState: RobotState
|}
