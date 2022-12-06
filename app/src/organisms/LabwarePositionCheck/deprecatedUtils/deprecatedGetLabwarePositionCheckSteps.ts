import { deprecatedGetPrimaryPipetteId } from './deprecatedGetPrimaryPipetteId'
import { getPipetteWorkflow } from './getPipetteWorkflow'
import { getOnePipettePositionCheckSteps } from './getOnePipettePositionCheckSteps'
import { getTwoPipettePositionCheckSteps } from './getTwoPipettePositionCheckSteps'
import type {
  RunTimeCommand,
  ProtocolAnalysisFile,
} from '@opentrons/shared-data/protocol/types/schemaV6'
import type {
  LegacySchemaAdapterOutput,
  LoadedPipette,
} from '@opentrons/shared-data'
import type { DeprecatedLabwarePositionCheckStep } from '../types'

export const deprecatedGetLabwarePositionCheckSteps = (
  protocolData: LegacySchemaAdapterOutput
): DeprecatedLabwarePositionCheckStep[] => {
  if (protocolData != null && 'pipettes' in protocolData) {
    // filter out any pipettes that are not being used in the protocol
    const pipettes: LoadedPipette[] = protocolData.pipettes.filter(pipette =>
      protocolData.commands.some(
        command =>
          command.commandType === 'pickUpTip' &&
          command.params.pipetteId === pipette.id
      )
    )
    const pipetteNames = pipettes.map(({ pipetteName }) => pipetteName)

    const labware = protocolData.labware.filter(
      labware =>
        !protocolData.labwareDefinitions[labware.definitionUri]?.parameters
          .isTiprack ||
        (protocolData.labwareDefinitions[labware.definitionUri]?.parameters
          .isTiprack &&
          protocolData.commands.some(
            command =>
              command.commandType === 'pickUpTip' &&
              command.params.labwareId === labware.id
          ))
    )

    const modules: ProtocolAnalysisFile['modules'] = protocolData.modules
    const labwareDefinitions = protocolData.labwareDefinitions
    const commands: RunTimeCommand[] = protocolData.commands
    const primaryPipetteId = deprecatedGetPrimaryPipetteId(pipettes, commands)
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
      const secondaryPipetteId = pipettes.find(
        pipette => pipette.id !== primaryPipetteId
      )?.id as string

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
