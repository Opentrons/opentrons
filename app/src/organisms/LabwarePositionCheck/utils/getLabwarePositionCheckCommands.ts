import map from 'lodash/map'
import values from 'lodash/values'
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV5'
import type { ProtocolData } from '../../../redux/protocol/types'
import { getPrimaryPipetteId } from './getPrimaryPipetteId'
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
    const pipettesById: Record<string, FilePipette> = protocolData.pipettes
    const pipettes: FilePipette[] = values(pipettesById)
    const pipetteNames = pipettes.map(({ name }) => name)
    const labware = protocolData.labware
    // @ts-expect-error v1 protocols do not have commands
    const commands: Command[] = protocolData.commands
    const primaryPipetteId = getPrimaryPipetteId(pipettesById)
    const pipetteWorkflow = getPipetteWorkflow({
      pipetteNames,
      primaryPipetteId,
      labware,
      commands,
    })

    if (pipetteWorkflow === 1) {
      return getOnePipetteWorkflowCommands({
        primaryPipetteId,
        labware,
        commands,
      })
    } else {
      const secondaryPipette = pipettes.filter(
        pipette => pipette.name !== primaryPipetteId
      )[0].name
      return getTwoPipetteWorkflowCommands({
        primaryPipetteId,
        secondaryPipette,
        labware,
        commands,
      })
    }
  }
  console.error('expected pipettes to be in protocol data')
  return {}
}
