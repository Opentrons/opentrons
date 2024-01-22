import * as React from 'react'
import { Icon, IconName } from '@opentrons/components'
import { RunTimeCommand } from '@opentrons/shared-data'
import type { StyleProps } from '@opentrons/components'

const ICON_BY_COMMAND_TYPE: { [commandType: string]: IconName } = {
  delay: 'pause-circle',
  pause: 'pause-circle',
  waitForDuration: 'pause-circle',
  waitForResume: 'pause-circle',
}
interface CommandIconProps extends StyleProps {
  command: RunTimeCommand
  svgWidth?: string | number
}
export function CommandIcon(props: CommandIconProps): JSX.Element | null {
  const { command, svgWidth = '1rem', ...styleProps } = props
  let iconName = null
  if (
    command.commandType === 'moveLabware' &&
    command.params.strategy === 'manualMoveWithPause'
  ) {
    iconName = 'pause-circle' as IconName
  } else if (
    command.commandType === 'custom' &&
    command.params?.legacyCommandType === 'command.COMMENT'
  ) {
    iconName = 'comment' as IconName
  } else {
    iconName = ICON_BY_COMMAND_TYPE[command.commandType] ?? null
  }

  return iconName != null ? (
    <Icon {...styleProps} size={svgWidth} name={iconName} flex="0 0 auto" />
  ) : null
}
