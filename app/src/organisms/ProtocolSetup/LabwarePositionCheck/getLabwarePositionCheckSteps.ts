import values from 'lodash/values'
import { getPrimaryPipetteId } from './utils/getPrimaryPipetteId'
import { getPipetteWorkflow } from './utils/getPipetteWorkflow'
import { getOnePipettePositionCheckSteps } from './utils/getOnePipettePositionCheckSteps'
import { getTwoPipettePositionCheckSteps } from './utils/getTwoPipettePositionCheckSteps'
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV5'
import type { FilePipette } from '@opentrons/shared-data/protocol/types/schemaV3'
import type { FileModule } from '@opentrons/shared-data/protocol/types/schemaV4'
import type { ProtocolData } from '../../../redux/protocol/types'
import type { LabwarePositionCheckStep } from './types'

export const getLabwarePositionCheckSteps = (
  protocolData: ProtocolData
): LabwarePositionCheckStep[] => {
  if (protocolData != null && 'pipettes' in protocolData) {
    // @ts-expect-error v1 protocols do not have pipettes names (see the two different FilePipette types)
    const pipettesById: Record<string, FilePipette> = protocolData.pipettes
    const pipettes: FilePipette[] = values(pipettesById)
    const pipetteNames = pipettes.map(({ name }) => name)
    const labware = protocolData.labware
    // @ts-expect-error older protocols do not have modules
    const modules: Record<string, FileModule> = protocolData.modules
    // @ts-expect-error v1 protocols do not have labware defs
    const labwareDefinitions = protocolData.labwareDefinitions
    // @ts-expect-error v1 protocols do not have commands
    const commands: Command[] = protocolData.commands
    const primaryPipetteId = getPrimaryPipetteId(pipettesById)
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
