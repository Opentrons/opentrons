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

import { StyledText } from '../../atoms/text'
import { EMPTY_TIMESTAMP } from '../Devices/constants'
import { formatInterval } from '../RunTimeControl/utils'
import { InterventionCommandMessage } from './InterventionCommandMessage'
export interface PauseContentProps {
  startedAt: string | null
  message: string | null
}

export function PauseInterventionContent({
  startedAt,
  message,
}: PauseContentProps): JSX.Element {
  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap="0.75rem">
      <PauseHeader startedAt={startedAt} />
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
        <InterventionCommandMessage commandMessage={message} />
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
