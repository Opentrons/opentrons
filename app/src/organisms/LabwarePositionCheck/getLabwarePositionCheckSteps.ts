import { getPrimaryPipetteId } from './utils/getPrimaryPipetteId'
import { getCheckSteps } from './utils/getCheckSteps'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'
import type { ProtocolAnalysisOutput } from '@opentrons/shared-data/protocol/types/schemaV6'
import type { LabwarePositionCheckStep } from './types'

export const getLabwarePositionCheckSteps = (
  protocolData: ProtocolAnalysisOutput | CompletedProtocolAnalysis
): LabwarePositionCheckStep[] => {
  if (protocolData != null && 'pipettes' in protocolData) {
    // filter out any pipettes that are not being used in the protocol
    const pipettesUsedInProtocol: CompletedProtocolAnalysis['pipettes'] = protocolData.pipettes.filter(
      ({ id }) =>
        protocolData.commands.some(
          command =>
            command.commandType === 'pickUpTip' &&
            command.params.pipetteId === id
        )
    )
    console.log('pipettesUsedInProtocol', pipettesUsedInProtocol)
    const { labware, modules, commands } = protocolData
    console.log('labware', labware)
    console.log('modules', modules)
    console.log('commands', commands)
    const pipettesById = pipettesUsedInProtocol.reduce(
      (acc, pip) => ({ ...acc, [pip.id]: pip }),
      {}
    )
    console.log('pipettesById', pipettesById)
    const primaryPipetteId = getPrimaryPipetteId(pipettesById, commands)
    const secondaryPipetteId =
      pipettesUsedInProtocol.find(({ id }) => id !== primaryPipetteId)?.id ??
      null
    console.log('primaryPipetteId', primaryPipetteId)
    console.log('secondaryPipetteId', secondaryPipetteId)
    return getCheckSteps({
      primaryPipetteId,
      secondaryPipetteId,
      labware,
      modules,
      commands,
    })
  }
  console.error('expected pipettes to be in protocol data')
  return []
}
