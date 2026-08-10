import {
  useAccessControlEnabledQuery,
  useGetRobotServerAccessControlSettingsQuery,
} from '@opentrons/react-api-client'

import { useCurrentRunId } from './useCurrentRunId'
import { useNotifyRunQuery } from './useNotifyRunQuery'

export function useIsSigningRequired(): {
  isLoading: boolean
  isSigningRequired: boolean
  isDownloadingRequired: boolean
  logPeriodId: string | null
} {
  const currentRunId = useCurrentRunId()
  const { data: runRecord, isLoading: isRunRecordLoading } =
    useNotifyRunQuery(currentRunId)
  const {
    data: accessControlEnabled,
    isLoading: isAccessControlEnabledLoading,
  } = useAccessControlEnabledQuery()
  const {
    data: accessControlSettings,
    isLoading: isAccessControlSettingsLoading,
  } = useGetRobotServerAccessControlSettingsQuery()
  const isSigningRequired =
    (accessControlEnabled?.data.accessControlEnabled ?? false) &&
    (accessControlSettings?.data.requireSignoffForProtocolLog ?? false)
  const hasSignedBy = !!runRecord?.data.signedBy

  return {
    isLoading:
      isRunRecordLoading ||
      isAccessControlEnabledLoading ||
      isAccessControlSettingsLoading,
    isSigningRequired: isSigningRequired && !hasSignedBy,
    isDownloadingRequired:
      !!accessControlEnabled?.data.accessControlEnabled &&
      !!accessControlSettings?.data.requireLogsToBeSavedInApp,
    logPeriodId: runRecord?.data.logPeriodId ?? null,
  }
}
