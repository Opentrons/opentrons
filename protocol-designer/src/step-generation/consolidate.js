// @flow
import type {ConsolidateFormData, RobotState} from './'

// TODO add return type: AnnotatedCommands.
export default function consolidate (data: ConsolidateFormData, robotState: RobotState) {
  /**
    Consolidate will aspirate several times in sequence from multiple source wells,
    then dispense into a single destination.

    If the volume to aspirate from the source wells exceeds the max volume of the pipette,
    then consolidate will be broken up into multiple asp-asp-disp, asp-asp-disp cycles.

    A single uniform volume will be aspirated from every source well.
  */
  const pipetteHasTip = (robotState.tipState.pipettes[data.pipette])

  let commands = []

  if (!pipetteHasTip) {
    // TODO
  }

  return {
    annotation: {
      name: data.name,
      description: data.description
    },
    commands
  }
}
