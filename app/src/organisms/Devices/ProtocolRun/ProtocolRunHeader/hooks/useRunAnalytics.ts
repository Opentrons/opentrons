import * as React from 'react'
import { useRobotAnalyticsData, useTrackProtocolRunEvent } from '../../../hooks'
import { useRunStatus } from '../../../../RunTimeControl/hooks'
import { useIsRunCurrent } from '/app/resources/runs'
import { ANALYTICS_PROTOCOL_RUN_ACTION } from '/app/redux/analytics'

import { useRecoveryAnalytics } from '../../../../ErrorRecoveryFlows/hooks'
import { isTerminalRunStatus } from '../utils'

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
      isTerminalRunStatus(runStatus)

    if (areReportConditionsValid) {
      trackProtocolRunEvent({
        name: ANALYTICS_PROTOCOL_RUN_ACTION.FINISH,
        properties: robotAnalyticsData,
      })
    }
  }, [runStatus, isRunCurrent, runId, robotAnalyticsData])

  const { reportRecoveredRunResult } = useRecoveryAnalytics()
  React.useEffect(() => {
    if (isRunCurrent) {
      reportRecoveredRunResult(runStatus, enteredER)
    }
  }, [isRunCurrent, enteredER])
}
