import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  SPACING,
  useInterval,
} from '@opentrons/components'

import { EMPTY_TIMESTAMP } from '../Devices/constants'
import { formatInterval } from '../RunTimeControl/utils'
import { StyledText } from '../../atoms/text'

import type { WaitForResumeRunTimeCommand } from '@opentrons/shared-data'

export interface PauseContentProps {
  command: WaitForResumeRunTimeCommand
}

export function PauseInterventionContent({
  command,
}: PauseContentProps): JSX.Element {
  const { t, i18n } = useTranslation('protocol_command_text')

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap="0.75rem">
      <PauseHeader startedAt={command.startedAt} />
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
        <StyledText as="h6" color={COLORS.errorDisabled}>
          {i18n.format(t('notes'), 'upperCase')}:
        </StyledText>
        <StyledText as="p">
          {command.params?.message != null && command.params.message !== ''
            ? command.params.message.length > 220
              ? `${command.params.message.substring(0, 217)}...`
              : command.params.message
            : t('wait_for_resume')}
        </StyledText>
      </Flex>
    </Flex>
  )
}

interface PauseHeaderProps {
  startedAt: string | null
}

function PauseHeader({ startedAt }: PauseHeaderProps): JSX.Element {
  const { t, i18n } = useTranslation('run_details')
  const [now, setNow] = React.useState(Date())
  useInterval(() => setNow(Date()), 500, true)

  const runTime =
    startedAt != null ? formatInterval(startedAt, now) : EMPTY_TIMESTAMP

  return (
    <Flex alignItems={ALIGN_CENTER} gridGap="0.75rem">
      <Icon
        name="pause-circle"
        size={SPACING.spacing32}
        flex="0 0 auto"
        color={COLORS.darkGreyEnabled}
      />
      <StyledText as="h1">
        {i18n.format(t('paused_for'), 'capitalize')} {runTime}
      </StyledText>
    </Flex>
  )
}
