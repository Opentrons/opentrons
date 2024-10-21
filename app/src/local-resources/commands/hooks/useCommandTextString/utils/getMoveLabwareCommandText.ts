import { GRIPPER_WASTE_CHUTE_ADDRESSABLE_AREA } from '@opentrons/shared-data'

import { getFinalLabwareLocation } from './getFinalLabwareLocation'
import {
  getLabwareName,
  getLabwareDisplayLocation,
} from '/app/local-resources/labware'

import type { MoveLabwareRunTimeCommand } from '@opentrons/shared-data'
import type { HandlesCommands } from './types'

export function getMoveLabwareCommandText({
  command,
  allRunDefs,
  t,
  commandTextData,
  robotType,
}: HandlesCommands<MoveLabwareRunTimeCommand>): string {
  const { labwareId, newLocation, strategy } = command.params

  const allPreviousCommands = commandTextData?.commands.slice(
    0,
    commandTextData.commands.findIndex(c => c.id === command.id)
  )
  const oldLocation =
    allPreviousCommands != null
      ? getFinalLabwareLocation(labwareId, allPreviousCommands)
      : null

  const oldDisplayLocation = getLabwareDisplayLocation({
    location: oldLocation,
    robotType,
    allRunDefs,
    loadedLabwares: commandTextData?.labware ?? [],
    loadedModules: commandTextData?.modules ?? [],
    t,
  })
  const newDisplayLocation = getLabwareDisplayLocation({
    location: newLocation,
    robotType,
    allRunDefs,
    loadedLabwares: commandTextData?.labware ?? [],
    loadedModules: commandTextData?.modules ?? [],
    t,
  })

  const location = newDisplayLocation?.includes(
    GRIPPER_WASTE_CHUTE_ADDRESSABLE_AREA
  )
    ? 'Waste Chute'
    : newDisplayLocation

  return strategy === 'usingGripper'
    ? t('move_labware_using_gripper', {
        labware:
          commandTextData != null
            ? getLabwareName({
                allRunDefs,
                loadedLabwares: commandTextData.labware ?? [],
                labwareId,
              })
            : null,
        old_location: oldDisplayLocation,
        new_location: location,
      })
    : t('move_labware_manually', {
        labware:
          commandTextData != null
            ? getLabwareName({
                allRunDefs,
                loadedLabwares: commandTextData.labware ?? [],
                labwareId,
              })
            : null,
        old_location: oldDisplayLocation,
        new_location: location,
      })
}
