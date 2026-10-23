import { useState } from 'react'

import { RUN_STATUS_STOP_REQUESTED } from '@opentrons/api-client'
import {
  LegacyStyledText,
  TYPOGRAPHY,
  useInterval,
} from '@opentrons/components'

import { EMPTY_TIMESTAMP } from '/app/resources/runs'
import { formatInterval } from '/app/transformations/commands'

import type { CSSProp } from 'styled-components'
import type { ReactNode } from 'react'

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
}): ReactNode {
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
      : (completedAt ?? now)

  const runTime =
    startedAt != null ? formatInterval(startedAt, endTime) : EMPTY_TIMESTAMP

  return (
    <LegacyStyledText css={style != null ? style : TYPOGRAPHY.pRegular}>
      {runTime}
    </LegacyStyledText>
  )
}
