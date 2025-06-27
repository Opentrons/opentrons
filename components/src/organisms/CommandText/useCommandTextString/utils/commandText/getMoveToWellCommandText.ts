import { getFinalLabwareLocation } from '../getFinalLabwareLocation'
import { getLabwareDisplayLocation } from '../getLabwareDisplayLocation'
import { getLabwareName } from '../getLabwareName'

import type { MoveToWellRunTimeCommand } from '@opentrons/shared-data/command'
import type { HandlesCommands } from '../types'

export function getMoveToWellCommandText({
  command,
  allRunDefs,
  t,
  commandTextData,
  robotType,
}: HandlesCommands<MoveToWellRunTimeCommand>): string {
  const { wellName, labwareId, wellLocation } = command.params
  const {
    x: xOffsetUnformatted,
    y: yOffsetUnformatted,
    z: zOffsetUnformatted,
  } = wellLocation.offset
  const allPreviousCommands = commandTextData?.commands.slice(
    0,
    commandTextData.commands.findIndex(c => c.id === command.id)
  )
  const labwareLocation =
    allPreviousCommands != null
      ? getFinalLabwareLocation(labwareId, allPreviousCommands)
      : null

  const displayLocation = getLabwareDisplayLocation({
    loadedLabwares: commandTextData?.labware ?? [],
    location: labwareLocation?.locationSequence ?? labwareLocation?.location,
    robotType,
    allRunDefs,
    loadedModules: commandTextData?.modules ?? [],
    t,
  })

  return t('move_to_well', {
    wellName,
    labware:
      commandTextData != null
        ? getLabwareName({
            loadedLabwares: commandTextData.labware ?? [],
            labwareId,
            allRunDefs,
          })
        : null,
    xOffset: xOffsetUnformatted.toFixed(2),
    yOffset: yOffsetUnformatted.toFixed(2),
    zOffset: zOffsetUnformatted.toFixed(2),
    positionRelative: wellLocation.origin,
    displayLocation,
  })
}
