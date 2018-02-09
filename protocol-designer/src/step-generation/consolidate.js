// @flow
// import type {TransferishFormData} from '../steplist/types'
// TODO IMMEDIATELY import this type and use it in validateAndProcessForm
export type ConsolidateFormData = {|
  stepType: 'consolidate',
  // TODO SOON Ian 2018-02-09 name & description for annotation
  pipette: {| // TODO refactor all 'pipette fields', split PipetteData into its own type
    mount: 'left' | 'right', // TODO: pipette ID vs mount enum is TBD
    maxVolume: number,
    channels: 1 | 8
  |},
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
  changeTip: 'always' | 'once' | 'never', // TODO extract this enum as its own type
  /** uL of air aspirated before the first aspirate in each asp-asp-disp cycle */
  airGap: ?number,
  // TODO: "Aspirate" section's Mix settings... what do they mean for aspirate?
  /** Disposal volume is added to the volume of the first aspirate of each asp-asp-disp cycle */
  disposalVolume: ?number,

  // ===== DISPENSE SETTINGS =====
  /** Mix in destination well after dispense */
  mixInDestination: ?{| // TODO factor out mix type with ul/times as its own type
    ul: number,
    times: number
  |},
  /** Number of seconds to delay at the very end of the step (TODO: or after each dispense ?) */
  delayAfterDispense: ?number,
  /** If true, blow out in the specified labware after dispense at the end of each asp-asp-dispense cycle */
  blowOut: string // TODO LATER LabwareId type here instead of string?
|}

export default function consolidate (data: ConsolidateFormData) { // TODO add return type: AnnotatedCommands.
  /**
    Consolidate will aspirate several times in sequence from multiple source wells,
    then dispense into a single destination.

    If the volume to aspirate from the source wells exceeds the max volume of the pipette,
    then consolidate will be broken up into multiple asp-asp-disp, asp-asp-disp cycles.

    A single uniform volume will be aspirated from every source well.
  */
  let commands = []
  return {
    annotation: {
      name: 'Consolidate', // TODO annotation from form fields
      description: 'Consolidate It!' // TODO annotation from form fields
    },
    commands
  }
}
