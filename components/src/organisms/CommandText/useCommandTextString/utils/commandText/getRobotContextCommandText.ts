import type {
  RobotAxisMap,
  RobotCloseGripperJawRunTimeCommand,
  RobotMoveAxesRelativeRunTimeCommand,
  RobotMoveAxesToRunTimeCommand,
  RobotMoveToRunTimeCommand,
  RobotOpenGripperJawRunTimeCommand,
} from '@opentrons/shared-data/command'
import type { TFunction } from 'i18next'
import type { HandlesCommands } from '../types'

export function getRobotContextCommandText({
  command,
  t,
}: HandlesCommands<
  | RobotMoveToRunTimeCommand
  | RobotMoveAxesToRunTimeCommand
  | RobotMoveAxesRelativeRunTimeCommand
  | RobotOpenGripperJawRunTimeCommand
  | RobotCloseGripperJawRunTimeCommand
>): string {
  switch (command?.commandType) {
    case 'robot/moveTo':
      return getRobotMoveToCommandText({ command, t })
    case 'robot/moveAxesTo':
      return getRobotMoveAxesToCommandText({ command, t })
    case 'robot/moveAxesRelative':
      return getRobotMoveAxesRelativeCommandText({ command, t })
    case 'robot/openGripperJaw':
      return getRobotOpenGripperJawCommandText({ t })
    case 'robot/closeGripperJaw':
      return getRobotCloseGripperJawCommandText({ command, t })
    default:
      return ''
  }
}

type _CMD<T> = { command: T; t: TFunction }

function getRobotMoveToCommandText({
  command,
  t,
}: _CMD<RobotMoveToRunTimeCommand>): string {
  return t('move_mount_to', {
    mount: command.params.mount,
    ...command.params.destination,
  })
}

// note: this is much tougher to translate than a position because it has dynamic entries
const stringifyAxisMapEntries = (axisMap: RobotAxisMap): string =>
  Object.entries(axisMap)
    .map(([axisName, axisPosition]) => `{axisName}: {axisPosition}`)
    .join(', ')
const stringifyAxisMap = (axisMap: RobotAxisMap): string =>
  `(${stringifyAxisMapEntries(axisMap)})`

function getRobotMoveAxesToCommandText({
  command,
  t,
}: _CMD<RobotMoveAxesToRunTimeCommand>): string {
  return t('move_axes_to', {
    position: stringifyAxisMap(command.params.axis_map),
  })
}

function getRobotMoveAxesRelativeCommandText({
  command,
  t,
}: _CMD<RobotMoveAxesRelativeRunTimeCommand>): string {
  return t('move_axes_by', {
    displacement: stringifyAxisMap(command.params.axis_map),
  })
}

function getRobotOpenGripperJawCommandText({ t }: { t: TFunction }): string {
  return t('opening_gripper_jaw')
}

function getRobotCloseGripperJawCommandText({
  command,
  t,
}: _CMD<RobotCloseGripperJawRunTimeCommand>): string {
  return command.params.force
    ? t('closing_gripper_jaw_with_force', { force: command.params.force })
    : t('closing_gripper_jaw')
}
