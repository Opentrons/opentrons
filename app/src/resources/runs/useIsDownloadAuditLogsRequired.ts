import {
  useAccessControlEnabledQuery,
  useGetRobotServerAccessControlSettingsQuery,
} from '@opentrons/react-api-client'

import { useIsLogDeleted } from '../audit/useIsLogDeleted'
import { useNotifyRunQuery } from './useNotifyRunQuery'

export function useIsDownloadAuditLogsRequired(runId: string): {
  isRequired: boolean
  isLoading: boolean
} {
  const {
    data: accessControlEnabled,
    isLoading: isAccessControlEnabledLoading,
  } = useAccessControlEnabledQuery()
  const {
    data: accessControlSettings,
    isLoading: isAccessControlSettingsLoading,
  } = useGetRobotServerAccessControlSettingsQuery()
  const { data: runRecord, isLoading: isRunRecordLoading } =
    useNotifyRunQuery(runId)

  const isSigningStillRequired =
    !isAccessControlSettingsLoading &&
    !!accessControlSettings?.data.requireSignoffForProtocolLog &&
    !runRecord?.data.signedBy

  const isDownloadingRequired =
    !isAccessControlSettingsLoading &&
    !!accessControlSettings?.data.requireLogsToBeSavedInApp

  const logPeriodId = runRecord?.data.logPeriodId

  const { isLoading: isLogDeletedLoading, isDeleted: isLogDeleted } =
    useIsLogDeleted(logPeriodId ?? '')

  const isLoading =
    isAccessControlEnabledLoading ||
    isAccessControlSettingsLoading ||
    isRunRecordLoading ||
    isLogDeletedLoading

  const isRequired =
    !!accessControlEnabled?.data.accessControlEnabled &&
    isDownloadingRequired &&
    !isSigningStillRequired &&
    !isLogDeleted

  return { isRequired, isLoading }
}
