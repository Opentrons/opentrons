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
  const accessControlOn =
    accessControlEnabled?.data.accessControlEnabled ?? false
  const requireSignoff =
    accessControlSettings?.data.requireSignoffForProtocolLog ?? false
  const isSigningRequired =
    accessControlOn && requireSignoff && !runRecord?.data.signedBy

  return {
    isLoading:
      isAccessControlEnabledLoading ||
      (accessControlOn && isAccessControlSettingsLoading) ||
      (accessControlOn && requireSignoff && isRunRecordLoading),
    isSigningRequired,
    isDownloadingRequired:
      accessControlOn &&
      (accessControlSettings?.data.requireLogsToBeSavedInApp ?? false),
    logPeriodId: runRecord?.data.logPeriodId ?? null,
  }
}
