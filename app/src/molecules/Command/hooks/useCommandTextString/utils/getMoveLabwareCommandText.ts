import { GRIPPER_WASTE_CHUTE_ADDRESSABLE_AREA } from '@opentrons/shared-data'

import {
  getLabwareName,
  getLabwareDisplayLocation,
  getFinalLabwareLocation,
} from '../../../utils'

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
  const newDisplayLocation =
    commandTextData != null
      ? getLabwareDisplayLocation(
          commandTextData,
          allRunDefs,
          newLocation,
          t,
          robotType
        )
      : null

  const location = newDisplayLocation?.includes(
    GRIPPER_WASTE_CHUTE_ADDRESSABLE_AREA
  )
    ? 'Waste Chute'
    : newDisplayLocation

  return strategy === 'usingGripper'
    ? t('move_labware_using_gripper', {
        labware:
          commandTextData != null
            ? getLabwareName(commandTextData, labwareId)
            : null,
        old_location:
          oldLocation != null && commandTextData != null
            ? getLabwareDisplayLocation(
                commandTextData,
                allRunDefs,
                oldLocation,
                t,
                robotType
              )
            : '',
        new_location: location,
      })
    : t('move_labware_manually', {
        labware:
          commandTextData != null
            ? getLabwareName(commandTextData, labwareId)
            : null,
        old_location:
          oldLocation != null && commandTextData != null
            ? getLabwareDisplayLocation(
                commandTextData,
                allRunDefs,
                oldLocation,
                t,
                robotType
              )
            : '',
        new_location: location,
      })
}
