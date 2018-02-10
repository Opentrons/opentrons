// @flow

// import export type {TransferishFormData} from '../steplist/export types'
// TODO IMMEDIATELY import this export type and use it in validateAndProcessForm
export type ConsolidateFormData = {|
  stepType: 'consolidate',

  /** Optional user-readable name for this step */
  name: ?string,
  /** Optional user-readable description/notes for this step */
  description: ?string,

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
  changeTip: 'always' | 'once' | 'never', // TODO extract this enum as its own export type
  /** uL of air aspirated before the first aspirate in each asp-asp-disp cycle */
  airGap: number | false,
  // TODO: "Aspirate" section's Mix settings... what do they mean for aspirate?
  /** Disposal volume is added to the volume of the first aspirate of each asp-asp-disp cycle */
  disposalVolume: number | false,

  // ===== DISPENSE SETTINGS =====
  /** Mix in destination well after dispense */
  mixInDestination: {| // TODO factor out mix export type with ul/times as its own export type
    ul: number,
    times: number
  |} | false,
  /** Number of seconds to delay at the very end of the step (TODO: or after each dispense ?) */
  delayAfterDispense: number | false,
  /** If given, blow out in the specified labware after dispense at the end of each asp-asp-dispense cycle */
  blowOut: string | false // TODO LATER LabwareId export type here instead of string?
|}

export type Mount = 'left' | 'right'

export type DeckSlot = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12'

export type PipetteChannels = 1 | 8

export type PipetteData = {| // TODO refactor all 'pipette fields', split PipetteData into its own export type
  id: string, // TODO PipetteId export type here instead of string?
  mount: Mount,
  maxVolume: number,
  channels: PipetteChannels
|}

export type LabwareData = {
  type: string, // TODO LATER keys from JSON
  name: ?string, // user-defined nickname
  slot: DeckSlot
}

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
      [pipetteId: string] : boolean // true if tip is on pipette
    }
  }
|}

export type CommandReducer = {|
  nextCommands: Array<{}>, // TODO Command export type
  nextRobotState: RobotState
|}
