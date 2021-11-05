import * as React from 'react'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'

import { RunStatus } from '@opentrons/api-client'
import {
  useInterval,
  Text,
  FONT_BODY_1_DARK_SEMIBOLD,
  FONT_HUGE_DARK_SEMIBOLD,
  SPACING_3,
} from '@opentrons/components'

import { useRunStartTime, useRunStatus } from './hooks'
import { formatInterval } from './utils'

// flesh out TimerProps (to eliminate refetch)
interface TimerProps {
  startTime: string
  runStatus: RunStatus
  lastEventTime: string
}

export function Timer(): JSX.Element | null {
  const { t } = useTranslation('run_details')

  const startTime = useRunStartTime()
  const [runStatus, lastEventTime] = useRunStatus()

  const initialNow = Date()
  const [now, setNow] = React.useState(initialNow)
  // interval causing refetch
  useInterval(() => setNow(Date()), 500, true)

  const pausedAt = runStatus === 'paused' ? lastEventTime : null

  return startTime != null ? (
    <>
      <Text css={FONT_BODY_1_DARK_SEMIBOLD} marginBottom={SPACING_3}>{`${t(
        'start_time'
      )}: ${format(new Date(startTime), 'pppp')}`}</Text>
      {pausedAt != null ? (
        <>
          <Text css={FONT_BODY_1_DARK_SEMIBOLD}>{`${t('paused_for')}:`}</Text>
          <Text css={FONT_HUGE_DARK_SEMIBOLD} marginBottom={SPACING_3}>
            {formatInterval(pausedAt, now)}
          </Text>
        </>
      ) : null}
      <Text css={FONT_BODY_1_DARK_SEMIBOLD}>{`${t('run_time')}:`}</Text>
      <Text css={FONT_HUGE_DARK_SEMIBOLD} marginBottom={SPACING_3}>
        {pausedAt != null
          ? formatInterval(startTime, pausedAt)
          : formatInterval(startTime, now)}
      </Text>
    </>
  ) : null
}
