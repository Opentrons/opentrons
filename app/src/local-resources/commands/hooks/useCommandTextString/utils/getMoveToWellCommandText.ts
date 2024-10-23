import {
  getLabwareName,
  getLabwareDisplayLocation,
} from '/app/local-resources/labware'

import { getFinalLabwareLocation } from './getFinalLabwareLocation'

import type { MoveToWellRunTimeCommand } from '@opentrons/shared-data/command'
import type { HandlesCommands } from './types'

export function getMoveToWellCommandText({
  command,
  allRunDefs,
  t,
  commandTextData,
  robotType,
}: HandlesCommands<MoveToWellRunTimeCommand>): string {
  const { wellName, labwareId } = command.params
  const allPreviousCommands = commandTextData?.commands.slice(
    0,
    commandTextData.commands.findIndex(c => c.id === command.id)
  )
  const labwareLocation =
    allPreviousCommands != null
      ? getFinalLabwareLocation(labwareId, allPreviousCommands)
      : null

  const displayLocation = getLabwareDisplayLocation({
    location: labwareLocation,
    robotType,
    allRunDefs,
    loadedLabwares: commandTextData?.labware ?? [],
    loadedModules: commandTextData?.modules ?? [],
    t,
  })

  return t('move_to_well', {
    well_name: wellName,
    labware:
      commandTextData != null
        ? getLabwareName({
            loadedLabwares: commandTextData.labware ?? [],
            labwareId,
            allRunDefs,
          })
        : null,
    labware_location: displayLocation,
  })
}
