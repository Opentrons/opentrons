import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  useAccessControlEnabledQuery,
  useGetRobotServerAccessControlSettingsQuery,
  useLogPeriodSummariesQuery,
} from '@opentrons/react-api-client'

import { isTerminalRunStatus } from '/app/local-resources/runs/utils'

import { useCurrentRunId, useNotifyRunQuery } from '../runs'

export function useIsSigningOrDownloadingRequired(robotName: string): {
  isSigningRequired: boolean
  isDownloadingRequired: boolean
  onLinkClick: (event: React.MouseEvent<HTMLAnchorElement>) => void
} {
  const navigate = useNavigate()
  const { data: accessControlEnabled } = useAccessControlEnabledQuery()
  const { data: accessControlSettings } =
    useGetRobotServerAccessControlSettingsQuery()

  const signingSetting =
    accessControlEnabled?.data.accessControlEnabled &&
    accessControlSettings?.data.requireSignoffForProtocolLog
  const downloadingSetting =
    accessControlEnabled?.data.accessControlEnabled &&
    accessControlSettings?.data.requireLogsToBeSavedInApp

  const currentRunId = useCurrentRunId()
  const { data: runRecord } = useNotifyRunQuery(currentRunId)

  const isRunSigned = !!runRecord?.data?.signedBy
  const isRunTerminal = isTerminalRunStatus(runRecord?.data?.status ?? null)
  const isRunCurrent = !!runRecord?.data?.current

  const isSigningRequired = !!signingSetting && isRunTerminal && !isRunSigned

  const { data: logPeriodSummaries } = useLogPeriodSummariesQuery({
    enabled: !isSigningRequired,
  })

  const isDownloadingFromFilesRequired =
    !!downloadingSetting && (logPeriodSummaries?.meta?.totalLength ?? 0) > 1

  const isDownloadFromRunRequired =
    !!downloadingSetting && isRunTerminal && isRunCurrent

  const onLinkClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault()
      event.stopPropagation()
      if ((isSigningRequired || isDownloadFromRunRequired) && !!currentRunId) {
        navigate(
          `/devices/${robotName}/protocol-runs/${currentRunId}/run-preview`
        )
      } else if (isDownloadingFromFilesRequired) {
        navigate(`/devices/${robotName}/robot-settings/file-manager`)
      }
    },
    [
      isSigningRequired,
      isDownloadFromRunRequired,
      isDownloadingFromFilesRequired,
      navigate,
      robotName,
      currentRunId,
    ]
  )

  return {
    isSigningRequired,
    isDownloadingRequired:
      isDownloadingFromFilesRequired || isDownloadFromRunRequired,
    onLinkClick,
  }
}
