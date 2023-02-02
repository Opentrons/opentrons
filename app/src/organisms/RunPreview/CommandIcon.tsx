import * as React from 'react'
import { SPACING, Icon, IconName } from '@opentrons/components'
import { RunTimeCommand } from '@opentrons/shared-data'

const ICON_BY_COMMAND_TYPE: { [commandType: string]: IconName } = {
  delay: 'pause-circle',
  pause: 'pause-circle',
  waitForDuration: 'pause-circle',
  waitForResume: 'pause-circle',
}
interface CommandIconProps {
  command: RunTimeCommand
}
export function CommandIcon(props: CommandIconProps): JSX.Element | null {
  const { command } = props
  let iconName = null
  if (
    command.commandType === 'moveLabware' &&
    command.params.strategy === 'manualMoveWithPause'
  ) {
    iconName = 'pause-circle' as IconName
  } else {
    iconName = ICON_BY_COMMAND_TYPE[command.commandType] ?? null
  }

  return iconName != null ? (
    <Icon name={iconName} size={SPACING.spacingM} flex="0 0 auto" />
  ) : null
}
