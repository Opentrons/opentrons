import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { StyledText } from '../../../atoms/text'
import { formatInterval } from '../../../organisms/RunTimeControl/utils'
import { EMPTY_TIMESTAMP } from '../constants'

interface TimerProps {
  commandStartedAt: string | null
  commandCompletedAt: string | null
  runStartedAt: string | null
}

export function StepTimer(props: TimerProps): JSX.Element {
  const { commandStartedAt, commandCompletedAt, runStartedAt } = props
  const { t } = useTranslation('run_details')

  const startTime =
    commandStartedAt != null && runStartedAt != null
      ? formatInterval(runStartedAt, commandStartedAt)
      : EMPTY_TIMESTAMP

  const endTime =
    commandCompletedAt != null && runStartedAt != null
      ? formatInterval(runStartedAt, commandCompletedAt)
      : EMPTY_TIMESTAMP

  return (
    <>
      <StyledText as="label">{`${t(
        'start_step_time'
      )}: ${startTime}`}</StyledText>
      <StyledText as="label">{`${t('end_step_time')}: ${endTime}`}</StyledText>
    </>
  )
}
