import * as React from 'react'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'

import {
  useInterval,
  Text,
  FONT_BODY_1_DARK_SEMIBOLD,
  FONT_HUGE_DARK_SEMIBOLD,
  SPACING_3,
} from '@opentrons/components'
import { RUN_STATUS_STOP_REQUESTED } from '@opentrons/api-client'
import { formatInterval } from './utils'

interface TimerProps {
  startTime: string
  pausedAt: string | null
  stoppedAt: string | null
  completedAt: string | null
  runStatus?: string
}

export function Timer({
  startTime,
  pausedAt,
  stoppedAt,
  completedAt,
  runStatus,
}: TimerProps): JSX.Element {
  const { t } = useTranslation('run_details')

  const [now, setNow] = React.useState(Date())
  useInterval(() => setNow(Date()), 500, true)

  const endTime = completedAt ?? now

  return (
    <>
      <Text css={FONT_BODY_1_DARK_SEMIBOLD} marginBottom={SPACING_3}>{`${t(
        'start_time'
      )}: ${format(new Date(startTime), 'pppp')}`}</Text>
      {pausedAt != null ? (
        <>
          <Text css={FONT_BODY_1_DARK_SEMIBOLD}>{`${t('paused_for')}:`}</Text>
          <Text css={FONT_HUGE_DARK_SEMIBOLD} marginBottom={SPACING_3}>
            {formatInterval(pausedAt, endTime)}
          </Text>
        </>
      ) : null}
      <>
        <Text css={FONT_BODY_1_DARK_SEMIBOLD}>{`${t('run_time')}:`}</Text>
        <Text css={FONT_HUGE_DARK_SEMIBOLD} marginBottom={SPACING_3}>
          {runStatus === RUN_STATUS_STOP_REQUESTED && stoppedAt != null
            ? formatInterval(stoppedAt, startTime)
            : formatInterval(startTime, endTime)}
        </Text>
      </>
    </>
  )
}
