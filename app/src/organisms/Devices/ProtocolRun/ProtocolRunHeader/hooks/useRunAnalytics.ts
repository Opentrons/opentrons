import * as React from 'react'
import { useRobotAnalyticsData, useTrackProtocolRunEvent } from '../../../hooks'
import { useRunStatus } from '../../../../RunTimeControl/hooks'
import { useIsRunCurrent } from '../../../../../resources/runs'
import { ANALYTICS_PROTOCOL_RUN_ACTION } from '../../../../../redux/analytics'

import { useRecoveryAnalytics } from '../../../../ErrorRecoveryFlows/hooks'
import { TERMINAL_STATUSES } from '../constants'

interface UseRunAnalyticsProps {
  runId: string | null
  robotName: string
  enteredER: boolean
}

// Implicitly send reports related to the run when the current run is terminal.
export function useRunAnalytics({
  runId,
  robotName,
  enteredER,
}: UseRunAnalyticsProps): void {
  const { trackProtocolRunEvent } = useTrackProtocolRunEvent(runId, robotName)
  const robotAnalyticsData = useRobotAnalyticsData(robotName)
  const runStatus = useRunStatus(runId)
  const isRunCurrent = useIsRunCurrent(runId)

  React.useEffect(() => {
    const areReportConditionsValid =
      isRunCurrent &&
      runId != null &&
      robotAnalyticsData != null &&
      TERMINAL_STATUSES.includes(runStatus)

    if (areReportConditionsValid) {
      trackProtocolRunEvent({
        name: ANALYTICS_PROTOCOL_RUN_ACTION.FINISH,
        properties: robotAnalyticsData,
      })
    }
  }, [runStatus, isRunCurrent, runId, robotAnalyticsData?.robotLeftPipette])

  const { reportRecoveredRunResult } = useRecoveryAnalytics()
  React.useEffect(() => {
    if (isRunCurrent) {
      reportRecoveredRunResult(runStatus, enteredER)
    }
  }, [isRunCurrent, enteredER])
}
