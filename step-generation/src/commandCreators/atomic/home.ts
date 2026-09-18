import {
  formatPyList,
  formatPyStr,
  PROTOCOL_CONTEXT_NAME,
  uuid,
} from '../../utils'

import type { HomeCreateCommand } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'

export const home: CommandCreator<HomeCreateCommand['params']> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { axes, skipIfMountPositionOk } = args

  const command: HomeCreateCommand = {
    commandType: 'home',
    key: uuid(),
    params: {
      axes,
      skipIfMountPositionOk,
    },
  }
  const pythonArgs = [
    ...(axes != null ? [`axes=${formatPyList(axes)},\n`] : []),
    ...(skipIfMountPositionOk != null
      ? [`skipIfMountPositionOk=${formatPyStr(skipIfMountPositionOk)},\n`]
      : []),
  ]

  const python = `${PROTOCOL_CONTEXT_NAME}.home(${pythonArgs.join(', ')})`
  return {
    commands: [command],
    python: python,
  }
}
