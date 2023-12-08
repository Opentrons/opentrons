import { useTranslation } from 'react-i18next'
import {
  CompletedProtocolAnalysis,
  MoveLabwareRunTimeCommand,
  RobotType,
  GRIPPER_WASTE_CHUTE_ADDRESSABLE_AREA,
} from '@opentrons/shared-data'
import { getLabwareName } from './utils'
import { getLabwareDisplayLocation } from './utils/getLabwareDisplayLocation'
import { getFinalLabwareLocation } from './utils/getFinalLabwareLocation'

interface MoveLabwareCommandTextProps {
  command: MoveLabwareRunTimeCommand
  robotSideAnalysis: CompletedProtocolAnalysis
  robotType: RobotType
}
export function MoveLabwareCommandText(
  props: MoveLabwareCommandTextProps
): JSX.Element {
  const { t } = useTranslation('protocol_command_text')
  const { command, robotSideAnalysis, robotType } = props
  const { labwareId, newLocation, strategy } = command.params

  const allPreviousCommands = robotSideAnalysis.commands.slice(
    0,
    robotSideAnalysis.commands.findIndex(c => c.id === command.id)
  )
  const oldLocation = getFinalLabwareLocation(labwareId, allPreviousCommands)
  const newDisplayLocation = getLabwareDisplayLocation(
    robotSideAnalysis,
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
        labware: getLabwareName(robotSideAnalysis, labwareId),
        old_location:
          oldLocation != null
            ? getLabwareDisplayLocation(
                robotSideAnalysis,
                oldLocation,
                t,
                robotType
              )
            : '',
        new_location: location,
      })
    : t('move_labware_manually', {
        labware: getLabwareName(robotSideAnalysis, labwareId),
        old_location:
          oldLocation != null
            ? getLabwareDisplayLocation(
                robotSideAnalysis,
                oldLocation,
                t,
                robotType
              )
            : '',
        new_location: location,
      })
}
