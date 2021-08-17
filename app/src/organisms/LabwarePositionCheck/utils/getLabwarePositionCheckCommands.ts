import map from 'lodash/map'
import values from 'lodash/values'
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV5'
import type { ProtocolData } from '../../../redux/protocol/types'
import { getPrimaryPipette } from './getPrimaryPipette'
import { getPipetteWorkflow } from './getPipetteWorkflow'
import { getOnePipetteWorkflowCommands } from './getOnePipetteWorkflowCommands'
import { getTwoPipetteWorkflowCommands } from './getTwoPipetteWorkflowCommands'
import { FilePipette } from '@opentrons/shared-data/protocol/types/schemaV3'

export interface CommandsByStepNumber {
  [stepNumber: string]: { commandsToRunBeforeStep: Command[] }
}

export const getLabwarePositionCheckCommands = (
  protocolData: ProtocolData
): CommandsByStepNumber => {
  if (protocolData != null && 'pipettes' in protocolData) {
    // @ts-expect-error v1 protocols do not have pipettes names (see the two different FilePipette types)
    const pipettes: FilePipette[] = values(protocolData.pipettes)
    const labware = protocolData.labware
    // @ts-expect-error v1 protocols do not have commands
    const commands = protocolData.commands
    const primaryPipette = getPrimaryPipette(pipettes)
    const pipetteWorkflow = getPipetteWorkflow({
      pipettes,
      primaryPipette,
      labware,
      commands,
    })

    if (pipetteWorkflow === 1) {
      return getOnePipetteWorkflowCommands({
        primaryPipette: primaryPipette,
        labware,
        commands,
      })
    } else {
      const secondaryPipette = pipettes.filter(
        pipette => pipette.name !== primaryPipette
      )[0].name
      return getTwoPipetteWorkflowCommands({
        primaryPipette,
        secondaryPipette,
        labware,
        commands,
      })
    }
  }
  console.error('expected pipettes to be in protocol data')
  return {}
}
