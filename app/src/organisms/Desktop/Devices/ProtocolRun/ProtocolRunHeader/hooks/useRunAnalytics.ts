import { useEffect } from 'react'

import {
  SOURCE_RUN_RECORD,
  useCameraAnalytics,
  useRecoveryAnalytics,
  useRobotAnalyticsData,
  useTrackProtocolRunEvent,
} from '/app/redux-resources/analytics'
import { useRobotType } from '/app/redux-resources/robots'
import { ANALYTICS_PROTOCOL_RUN_ACTION } from '/app/redux/analytics'
import { useRunGeneratedDataFiles } from '/app/resources/dataFiles/useRunGeneratedDataFiles'
import {
  DEFAULT_STATUS_REFETCH_INTERVAL,
  useIsRunCurrent,
  useNotifyRunQuery,
} from '/app/resources/runs'

import { isTerminalRunStatus } from '../utils'

interface UseRunAnalyticsProps {
  runId: string
  robotName: string
  enteredER: boolean
}

// Implicitly send reports related to the run when the current run is terminal.
export function useRunAnalytics({
  runId,
  robotName,
  enteredER,
}: UseRunAnalyticsProps): void {
  const robotType = useRobotType(robotName)
  const outputFileIds = useRunGeneratedDataFiles(runId)
  const numberOfImages = outputFileIds.jpeg.length
  const { trackProtocolRunEvent } = useTrackProtocolRunEvent(runId, robotName)
  const robotAnalyticsData = useRobotAnalyticsData(robotName)
  const { data: runRecord } = useNotifyRunQuery(runId, {
    refetchInterval: DEFAULT_STATUS_REFETCH_INTERVAL,
  })
  const runStatus = runRecord?.data.status ?? null
  const isRunCurrent = useIsRunCurrent(runId)
  const { reportImageCaptureUsage } = useCameraAnalytics({
    source: SOURCE_RUN_RECORD,
    robotType: robotType,
  })
  useEffect(() => {
    const areReportConditionsValid =
      isRunCurrent && runId != null && isTerminalRunStatus(runStatus)
    if (areReportConditionsValid) {
      reportImageCaptureUsage({
        transactionId: runId,
        amount: numberOfImages,
      })
      trackProtocolRunEvent({
        name: ANALYTICS_PROTOCOL_RUN_ACTION.FINISH,
        properties: robotAnalyticsData ?? undefined,
      })
    }
  }, [runStatus, isRunCurrent, runId, robotAnalyticsData])

  const { reportRecoveredRunResult } = useRecoveryAnalytics()
  useEffect(() => {
    if (isRunCurrent) {
      reportRecoveredRunResult(runStatus, enteredER)
    }
  }, [isRunCurrent, enteredER])
}
