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
    const pipettes: ProtocolAnalysisFile['pipettes'] = omitBy(
      protocolData.pipettes,
      _pipette =>
        !protocolData.commands.some(
          command =>
            command.commandType === 'pickUpTip' &&
            //  @ts-expect-error: pipetteName should be name until we remove the schemaV6Adapter
            command.params.pipetteId === _pipette.id
        )
    )
    //  @ts-expect-error: pipetteName should be name until we remove the schemaV6Adapter
    const pipetteNames = pipettes.map(({ pipetteName }) => pipetteName)
    //  @ts-expect-error
    const labware = protocolData.labware.filter(
      //  @ts-expect-error
      labware =>
        protocolData.labwareDefinitions[labware.definitionUri]?.parameters
          .isTiprack ||
        !protocolData.commands.some(
          command =>
            command.commandType === 'pickUpTip' &&
            command.params.labwareId === labware.id
        )
    )

    const modules: ProtocolAnalysisFile['modules'] = protocolData.modules
    const labwareDefinitions = protocolData.labwareDefinitions
    const commands: RunTimeCommand[] = protocolData.commands
    const primaryPipetteId = getPrimaryPipetteId(pipettes, commands)
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
      //  @ts-expect-error
      const secondaryPipetteId = values(pipettes).find(
        //  @ts-expect-error
        pipette => pipette.id !== primaryPipetteId
        //  @ts-expect-error
      ).id
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
