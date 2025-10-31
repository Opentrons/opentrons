import { useEffect } from 'react'

import {
  useCameraAnalytics,
  useRecoveryAnalytics,
  useRobotAnalyticsData,
  useTrackProtocolRunEvent,
} from '/app/redux-resources/analytics'
import { useIsFlex } from '/app/redux-resources/robots'
import { ANALYTICS_PROTOCOL_RUN_ACTION } from '/app/redux/analytics'
import { useRunGeneratedDataFiles } from '/app/resources/dataFiles/useRunGeneratedDataFiles'
import { useIsRunCurrent, useRunStatus } from '/app/resources/runs'

import { isTerminalRunStatus } from '../utils'

import type { RobotType } from '@opentrons/shared-data'

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
  const isFlex = useIsFlex(robotName)
  const robotType = isFlex ? 'OT-3 Standard' : ('OT-2 Standard' as RobotType)
  const outputFileIds = useRunGeneratedDataFiles(runId)
  const numberOfImages = outputFileIds.jpeg.length
  const { trackProtocolRunEvent } = useTrackProtocolRunEvent(runId, robotName)
  const robotAnalyticsData = useRobotAnalyticsData(robotName)
  const runStatus = useRunStatus(runId)
  const isRunCurrent = useIsRunCurrent(runId)
  const baseParams = {
    source: 'protocolRunRecord' as const,
    robotType: robotType,
  }
  const { reportImageCaptureUsage } = useCameraAnalytics(baseParams)
  useEffect(() => {
    const areReportConditionsValid =
      isRunCurrent && runId != null && isTerminalRunStatus(runStatus)
    if (areReportConditionsValid) {
      reportImageCaptureUsage({
        ...baseParams,
        runId: runId,
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
