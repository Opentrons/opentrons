import uniq from 'lodash/uniq'
import reduce from 'lodash/reduce'
import { getPipetteNameSpecs, PipetteName } from '@opentrons/shared-data'
import { PIPETTE_MOUNTS } from '../../../../redux/pipettes'

import type { Mount } from '../../../../redux/pipettes/types'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import { useProtocolDetails } from '../../../RunDetails/hooks'
import { LoadPipetteCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'

const UNKNOWN_STATE = { left: null, right: null }

interface PipetteInfo {}

export function useCurrentRunPipetteInfoByMount(): {
  [mount in Mount]: PipetteInfo | null
} {
  const { protocolData } = useProtocolDetails()

  if (protocolData == null) {
    return UNKNOWN_STATE
  }
  const { pipettes, labware, labwareDefinitions, commands } = protocolData
  const loadPipetteCommands = commands.filter(
    (commandObject): commandObject is LoadPipetteCommand =>
      commandObject.commandType === 'loadPipette'
  )

  const pipettesByInitialMount: {
    [mount in Mount]: { id: string; name: PipetteName } | null
  } = Object.entries(pipettes).reduce(
    (acc, [pipetteId, pipette]) => {
      const loadCommand = loadPipetteCommands.find(
        command => command.params.pipetteId == pipetteId
      )

      return loadCommand != null
        ? {
            ...acc,
            [loadCommand.params.mount]: { ...pipette, id: pipetteId },
          }
        : acc
    },
    { left: null, right: null }
  )

  const tipRackCommands = commands.filter(
    commandObject => commandObject.commandType === 'pickUpTip'
  )
  const protocolPipetteValues = Object.values(pipettes)
  const protocolPipetteKeys = Object.keys(pipettes)

  return PIPETTE_MOUNTS.reduce<{ [mount in Mount]: PipetteInfo | null }>(
    (result, mount) => {
      const pipetteOnMount = pipettesByInitialMount[mount]
      if (pipetteOnMount != null) {
        const index = protocolPipetteValues.indexOf(pipetteOnMount)
        const pipetteKey = protocolPipetteKeys[index]
        let tipRackDefs: LabwareDefinition2[] = []
        tipRackCommands.forEach(command => {
          if (
            'pipette' in command.params &&
            'labware' in command.params &&
            pipetteKey === command.params.pipette
          ) {
            const tipRack = labware[command.params.labware]
            const tipRackDefinition = labwareDefinitions[tipRack.definitionId]
            if (tipRackDefinition !== undefined) {
              tipRackDefs.push(tipRackDefinition)
            }
          }
          tipRackDefs = uniq(tipRackDefs)
        })
        result[mount] = {
          pipetteSpecs: getPipetteNameSpecs(pipetteOnMount.name),
          tipRackDefs: tipRackDefs,
        }
      } else {
        result[mount] = null
      }
      return result
    },
    { left: null, right: null }
  )
}
