import { EXTENSION, LEFT, RIGHT } from '@opentrons/shared-data'

import type { TFunction } from 'i18next'
import type {
  MotorAxis,
  RobotCloseGripperJawRunTimeCommand,
  RobotMotorAxisMap,
  RobotMoveAxesRelativeRunTimeCommand,
  RobotMoveAxesToRunTimeCommand,
  RobotMoveToRunTimeCommand,
  RobotOpenGripperJawRunTimeCommand,
} from '@opentrons/shared-data'
import type { HandlesCommands } from '../../'

const formatAxisMap = (axisMap: RobotMotorAxisMap, t: TFunction): string => {
  const sortedAxes = [
    'x',
    'y',
    'leftZ',
    'rightZ',
    'extensionZ',
    'leftPlunger',
    'rightPlunger',
    'extensionJaw',
  ] as const
  const names: Record<MotorAxis, string> = {
    x: 'X',
    y: 'Y',
    leftZ: t('left_z'),
    rightZ: t('right_z'),
    leftPlunger: t('left_plunger'),
    rightPlunger: t('right_plunger'),
    extensionZ: t('extension_z'),
    extensionJaw: t('extension_jaw'),
  }
  const coordinateStr = sortedAxes
    .map(axis => {
      if (Object.hasOwn(axisMap, axis)) {
        return `${names[axis]}: ${axisMap[axis]}`
      }
      return undefined
    })
    .filter(x => x != null)
    .join(', ')
  return `(${coordinateStr})`
}

export type SupportedCommands =
  | RobotMoveToRunTimeCommand
  | RobotMoveAxesToRunTimeCommand
  | RobotMoveAxesRelativeRunTimeCommand
  | RobotOpenGripperJawRunTimeCommand
  | RobotCloseGripperJawRunTimeCommand

export const getRobotCommandText = ({
  command,
  t,
}: HandlesCommands<SupportedCommands>): string => {
  switch (command?.commandType) {
    case 'robot/moveTo': {
      const { destination, mount } = command.params
      const gantryMountName = (): string => {
        switch (mount) {
          case LEFT:
            return t('left_mount')
          case RIGHT:
            return t('right_mount')
          case EXTENSION:
            return t('extension_mount')
        }
      }
      return t('robot_move_to', { ...destination, mount: gantryMountName() })
    }
    case 'robot/moveAxesTo':
      return t('robot_move_axes_to', {
        position: formatAxisMap(command.params.axis_map, t),
      })
    case 'robot/moveAxesRelative':
      return t('robot_move_axes_relative', {
        displacement: formatAxisMap(command.params.axis_map, t),
      })
    case 'robot/openGripperJaw':
      return t('robot_open_gripper_jaw')
    case 'robot/closeGripperJaw':
      return t('robot_close_gripper_jaw')
  }
}
