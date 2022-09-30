import omitBy from 'lodash/omitBy'
import values from 'lodash/values'
import { getPrimaryPipetteId } from './utils/getPrimaryPipetteId'
import { getPipetteWorkflow } from './utils/getPipetteWorkflow'
import { getOnePipettePositionCheckSteps } from './utils/getOnePipettePositionCheckSteps'
import { getTwoPipettePositionCheckSteps } from './utils/getTwoPipettePositionCheckSteps'
import type {
  RunTimeCommand,
  ProtocolAnalysisFile,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data/protocol/types/schemaV6'
import type { LabwarePositionCheckStep } from './types'

export const getLabwarePositionCheckSteps = (
  protocolData: ProtocolAnalysisOutput
): LabwarePositionCheckStep[] => {
  if (protocolData != null && 'pipettes' in protocolData) {
    // filter out any pipettes that are not being used in the protocol
    const pipettesUsedInProtocol: ProtocolAnalysisOutput['pipettes'] = 
      protocolData.pipettes.filter(
      ({id}) =>
        protocolData.commands.some(
          command =>
            command.commandType === 'pickUpTip' &&
            command.params.pipetteId === id
        )
    )
    const labware = omitBy(
      protocolData.labware,
      (labware, id) =>
        protocolData.labwareDefinitions[labware.definitionId]?.parameters
          .isTiprack &&
        !protocolData.commands.some(
          command =>
            command.commandType === 'pickUpTip' &&
            command.params.labwareId === id
        )
    )
    const modules: ProtocolAnalysisFile['modules'] = protocolData.modules
    const labwareDefinitions = protocolData.labwareDefinitions
    const commands: RunTimeCommand[] = protocolData.commands
    const primaryPipetteId = getPrimaryPipetteId(pipettesById, commands)
    const pipetteWorkflow = getPipetteWorkflow({
      pipetteNames: pipettesUsedInProtocol.map(({pipetteName}) => pipetteName),
      primaryPipetteId,
      labware,
      labwareDefinitions,
      commands,
    })

    if (pipetteWorkflow === 1) {
      return getOnePipettePositionCheckSteps({
        primaryPipetteId,
        labware,
        labwareDefinitions,
        modules,
        commands,
      })
    } else {
      const secondaryPipetteId = Object.keys(pipettesById).find(
        pipetteId => pipetteId !== primaryPipetteId
      ) as string

      return getTwoPipettePositionCheckSteps({
        primaryPipetteId,
        secondaryPipetteId,
        labware,
        labwareDefinitions,
        modules,
        commands,
      })
    }
  }
  console.error('expected pipettes to be in protocol data')
  return []
}
