import omitBy from 'lodash/omitBy'
import values from 'lodash/values'
import { getPrimaryPipetteId } from './utils/getPrimaryPipetteId'
import { getPipetteWorkflow } from './utils/getPipetteWorkflow'
import { getOnePipettePositionCheckSteps } from './utils/getOnePipettePositionCheckSteps'
import { getTwoPipettePositionCheckSteps } from './utils/getTwoPipettePositionCheckSteps'
import type {
  RunTimeCommand,
  ProtocolAnalysisFile,
} from '@opentrons/shared-data/protocol/types/schemaV6'
import type { LabwarePositionCheckStep } from './types'

export const getLabwarePositionCheckSteps = (
  protocolData: ProtocolAnalysisFile
): LabwarePositionCheckStep[] => {
  if (protocolData != null && 'pipettes' in protocolData) {
    // filter out any pipettes that are not being used in the protocol
    const pipettesById: ProtocolAnalysisFile['pipettes'] = omitBy(
      protocolData.pipettes,
      _pipette =>
        !protocolData.commands.some(
          command =>
            command.commandType === 'pickUpTip' &&
            //  @ts-expect-error: pipetteName should be name until we remove the schemaV6Adapter
            command.params.pipetteId === _pipette.id
        )
    )
    const pipettes = values(pipettesById)
    //  @ts-expect-error: pipetteName should be name until we remove the schemaV6Adapter
    const pipetteNames = pipettes.map(({ pipetteName }) => pipetteName)
    const labware = omitBy(
      protocolData.labware,
      (labware, id) =>
        //  @ts-expect-error: will be an error until we remove the schemaV6Adapter
        protocolData.labwareDefinitions[labware.definitionUri]?.parameters
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
      pipetteNames,
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
      const secondaryPipetteId =
        //  @ts-expect-error
        Object.values(pipettesById)[0].id !== primaryPipetteId
          ? //  @ts-expect-error
            Object.values(pipettesById)[0].id
          : //  @ts-expect-error
            Object.values(pipettesById)[1].id
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
