import * as React from 'react'
import { CSSProp } from 'styled-components'

import { RUN_STATUS_STOP_REQUESTED } from '@opentrons/api-client'
import { useInterval, TYPOGRAPHY } from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
import { formatInterval } from '../../../organisms/RunTimeControl/utils'
import { EMPTY_TIMESTAMP } from '../constants'

export function RunTimer({
  runStatus,
  startedAt,
  stoppedAt,
  completedAt,
  style,
}: {
  runStatus: string | null
  startedAt: string | null
  stoppedAt: string | null
  completedAt: string | null
  style?: CSSProp
}): JSX.Element {
  const [now, setNow] = React.useState(Date())
  useInterval(() => setNow(Date()), 500, true)

  const endTime =
    runStatus === RUN_STATUS_STOP_REQUESTED && stoppedAt != null
      ? stoppedAt
      : completedAt ?? now

  const runTime =
    startedAt != null ? formatInterval(startedAt, endTime) : EMPTY_TIMESTAMP

  return (
    <StyledText css={style != null ? style : TYPOGRAPHY.pRegular}>
      {runTime}
    </StyledText>
  )
}
