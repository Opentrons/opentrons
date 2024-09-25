import { useState } from 'react'

import { RUN_STATUS_STOP_REQUESTED } from '@opentrons/api-client'
import {
  useInterval,
  TYPOGRAPHY,
  LegacyStyledText,
} from '@opentrons/components'

import { formatInterval } from '/app/transformations/commands'
import { EMPTY_TIMESTAMP } from '/app/resources/runs'
import type { CSSProp } from 'styled-components'

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
  const [now, setNow] = useState(Date())
  useInterval(
    () => {
      setNow(Date())
    },
    500,
    true
  )

  const endTime =
    runStatus === RUN_STATUS_STOP_REQUESTED && stoppedAt != null
      ? stoppedAt
      : completedAt ?? now

  const runTime =
    startedAt != null ? formatInterval(startedAt, endTime) : EMPTY_TIMESTAMP

  return (
    <LegacyStyledText css={style != null ? style : TYPOGRAPHY.pRegular}>
      {runTime}
    </LegacyStyledText>
  )
}
