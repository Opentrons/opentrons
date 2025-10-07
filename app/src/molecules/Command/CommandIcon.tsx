import { COLORS, Icon } from '@opentrons/components'

import type { IconName } from '@opentrons/components'
import type { RunTimeCommand } from '@opentrons/shared-data'

type CommandType = RunTimeCommand['commandType']
const ICON_BY_COMMAND_TYPE: Partial<Record<CommandType, IconName>> = {
  comment: 'comment',
  delay: 'pause-circle',
  pause: 'pause-circle',
  waitForDuration: 'pause-circle',
  waitForResume: 'pause-circle',
}
interface CommandIconProps {
  command: RunTimeCommand
  size?: string | number
  color?: string
}
export function CommandIcon(props: CommandIconProps): JSX.Element | null {
  const {
    command,
    size = '1rem',
    color = COLORS.black90,
    ...styleProps
  } = props
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
    <Icon
      {...styleProps}
      size={size}
      name={iconName}
      color={color}
      flex="0 0 auto"
    />
  ) : null
}
