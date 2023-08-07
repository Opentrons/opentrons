import { getPrimaryPipetteId } from './utils/getPrimaryPipetteId'
import { getCheckSteps } from './utils/getCheckSteps'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'
import type { LabwarePositionCheckStep } from './types'
import { getGoldenCheckSteps } from './utils/getGoldenCheckSteps'

export const getLabwarePositionCheckSteps = (
  protocolData: CompletedProtocolAnalysis
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
    const { labware, modules, commands } = protocolData
    if (pipettesUsedInProtocol.length === 0) {
      throw new Error(
        'pipettes do not pick up a tip within protocol, labware position check cannot be performed'
      )
    }
    const pipettesById = pipettesUsedInProtocol.reduce(
      (acc, pip) => ({ ...acc, [pip.id]: pip }),
      {}
    )
    const primaryPipetteId = getPrimaryPipetteId(pipettesById, commands)
    const secondaryPipetteId =
      pipettesUsedInProtocol.find(({ id }) => id !== primaryPipetteId)?.id ??
      null
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

export const getGoldenLabwarePositionCheckSteps = (
  protocolData: CompletedProtocolAnalysis
): LabwarePositionCheckStep[] => {
  if (protocolData != null && 'pipettes' in protocolData) {
    if (protocolData.pipettes.length === 0) {
      throw new Error(
        'no pipettes loaded within protocol, labware position check cannot be performed'
      )
    }
    return getGoldenCheckSteps(protocolData)
  }
  throw new Error(
    'no pipettes found in protocol, labware position check cannot be performed'
  )
}
