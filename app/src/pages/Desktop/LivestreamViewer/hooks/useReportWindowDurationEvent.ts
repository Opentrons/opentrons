import { useEffect, useState } from 'react'

import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { isTerminalRunStatus } from '/app/local-resources/runs/utils'
import {
  SOURCE_RUN_RECORD,
  useCameraAnalytics,
} from '/app/redux-resources/analytics'

import type { RunStatus } from '@opentrons/api-client'

export function useReportWindowDurationEvent(
  runId: string | null,
  runStatus: RunStatus | null,
  isLivestreamViewable: boolean
): void {
  const [streamStartTime, setStreamStartTime] = useState<number | null>(null)
  const { reportLiveFeedDuration } = useCameraAnalytics({
    source: SOURCE_RUN_RECORD,
    robotType: FLEX_ROBOT_TYPE,
  })

  // On initial render or at the start of a new run, start the timer if the
  // livestream is viewable.
  useEffect(() => {
    if (
      runId != null &&
      streamStartTime === null &&
      !isTerminalRunStatus(runStatus) &&
      isLivestreamViewable
    ) {
      const startTime = new Date().getTime()
      setStreamStartTime(startTime)
    }
  }, [streamStartTime, runStatus, isLivestreamViewable, runId])

  // If a run is terminal, we block livestream viewing, so send the event if the
  // stream was enabled.
  useEffect(() => {
    if (
      runId != null &&
      isTerminalRunStatus(runStatus) &&
      streamStartTime !== null
    ) {
      reportLiveFeedDuration({
        runId,
        durationSeconds: getDurationSeconds(streamStartTime),
      })
      setStreamStartTime(null)
    }
  }, [reportLiveFeedDuration, runId, runStatus, streamStartTime])

  // If the user closes the window while a run is not terminal, report it if
  // the stream was enabled.
  useEffect(() => {
    const handleBeforeUnload = (): void => {
      if (
        runId != null &&
        !isTerminalRunStatus(runStatus) &&
        streamStartTime !== null
      ) {
        reportLiveFeedDuration({
          runId,
          durationSeconds: getDurationSeconds(streamStartTime),
        })
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [reportLiveFeedDuration, runId, runStatus, streamStartTime])
}

const getDurationSeconds = (runStartTime: number): number =>
  (new Date().getTime() - runStartTime) / 1000
