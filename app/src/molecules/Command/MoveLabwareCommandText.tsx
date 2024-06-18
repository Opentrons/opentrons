import { useTranslation } from 'react-i18next'
import { GRIPPER_WASTE_CHUTE_ADDRESSABLE_AREA } from '@opentrons/shared-data'
import { getLabwareName } from './utils'
import { getLabwareDisplayLocation } from './utils/getLabwareDisplayLocation'
import { getFinalLabwareLocation } from './utils/getFinalLabwareLocation'
import type {
  MoveLabwareRunTimeCommand,
  RobotType,
} from '@opentrons/shared-data'
import type { CommandTextData } from './types'

interface MoveLabwareCommandTextProps {
  command: MoveLabwareRunTimeCommand
  commandTextData: CommandTextData
  robotType: RobotType
}
export function MoveLabwareCommandText(
  props: MoveLabwareCommandTextProps
): JSX.Element {
  const { t } = useTranslation('protocol_command_text')
  const { command, commandTextData, robotType } = props
  const { labwareId, newLocation, strategy } = command.params

  const allPreviousCommands = commandTextData.commands.slice(
    0,
    commandTextData.commands.findIndex(c => c.id === command.id)
  )
  const oldLocation = getFinalLabwareLocation(labwareId, allPreviousCommands)
  const newDisplayLocation = getLabwareDisplayLocation(
    commandTextData,
    newLocation,
    t,
    robotType
  )

  const location = newDisplayLocation.includes(
    GRIPPER_WASTE_CHUTE_ADDRESSABLE_AREA
  )
    ? 'Waste Chute'
    : newDisplayLocation

  return strategy === 'usingGripper'
    ? t('move_labware_using_gripper', {
        labware: getLabwareName(commandTextData, labwareId),
        old_location:
          oldLocation != null
            ? getLabwareDisplayLocation(
                commandTextData,
                oldLocation,
                t,
                robotType
              )
            : '',
        new_location: location,
      })
    : t('move_labware_manually', {
        labware: getLabwareName(commandTextData, labwareId),
        old_location:
          oldLocation != null
            ? getLabwareDisplayLocation(
                commandTextData,
                oldLocation,
                t,
                robotType
              )
            : '',
        new_location: location,
      })
}
