import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  CheckboxBasic,
  ERROR_TOAST,
  INFO_TOAST,
  InfoScreen,
  StyledText,
  SUCCESS_TOAST,
  WARNING_TOAST,
} from '@opentrons/components'
import {
  isDocumentedMutationError,
  useGetRobotServerAccessControlSettingsQuery,
  useLogPeriodSummariesQuery,
} from '@opentrons/react-api-client'

import { Skeleton } from '/app/atoms/Skeleton'
import { useLinkedDocumentationState } from '/app/local-resources/access-control/useLinkedDocumentationState'
import { getAuditLogDeleteErrorMessage } from '/app/local-resources/access-control/utils'
import { DownloadAuditLogsModal } from '/app/organisms/Desktop/DownloadAuditLogsModal'
import { useToaster } from '/app/organisms/ToasterOven'
import { useEnsureAuditLogAuthorization } from '/app/resources/audit/useEnsureAuditLogAuthorization'
import { useDeleteSelectedLogPeriods } from '/app/resources/devices/hooks/useDeleteSelectedLogPeriods'
import { useDownloadSelectedLogPeriods } from '/app/resources/devices/hooks/useDownloadSelectedLogPeriods'

import { DeleteRecordsModal } from '../../../DeleteRecordsModal'
import { FileManagementSectionHeader } from '../FileManagementSectionHeader'
import { useRecordSelection } from '../hooks/useRecordSelection'
import fileManagerStyles from '../robotsettingsfilemanager.module.css'
import styles from './compliancereadysoftwarefiles.module.css'
import { LogPeriodRow } from './LogPeriodRow'

import type { ReactNode } from 'react'
import type { LogPeriodSummary } from '@opentrons/api-client'
import type { IconProps } from '@opentrons/components'
import type { DocumentedAction } from '@opentrons/react-api-client'
import type { MakeToastOptions } from '/app/organisms/ToasterOven/ToasterContext'
import type { DownloadedLogPeriod } from '/app/resources/devices/hooks/useDownloadSelectedLogPeriods'

const TOAST_STYLE: MakeToastOptions = {
  closeButton: true,
  width: '80%',
}

const DELETE_LOG_PERIODS_ACTIONS: DocumentedAction[] = [
  'download_log_period',
  'delete_log_periods',
]

interface ComplianceReadySoftwareFilesProps {
  robotName: string
}

export function ComplianceReadySoftwareFiles({
  robotName,
}: ComplianceReadySoftwareFilesProps): ReactNode {
  const { t } = useTranslation(['device_details', 'access_control'])
  const { data: logPeriodSummariesData, status: logPeriodSummaryStatus } =
    useLogPeriodSummariesQuery()
  const { documentationState } = useLinkedDocumentationState(
    DELETE_LOG_PERIODS_ACTIONS,
    robotName,
    robotName
  )
  const ensureAuthorized = useEnsureAuditLogAuthorization(
    documentationState,
    DELETE_LOG_PERIODS_ACTIONS
  )
  const downloadLogPeriodsMutation = useDownloadSelectedLogPeriods(robotName)
  const {
    deleteSelectedLogPeriods,
    deletingIds,
    isLoading: isDeleting,
  } = useDeleteSelectedLogPeriods(documentationState)
  const { makeToast, eatToast } = useToaster()
  const observer = useRef<HTMLDivElement>(null)

  const {
    data: accessControlSettings,
    isLoading: isLoadingAccessControlSettings,
  } = useGetRobotServerAccessControlSettingsQuery()
  const requireDownloadSetting =
    accessControlSettings?.data.requireLogsToBeSavedInApp ?? false

  // API returns periods oldest-to-newest; reverse for newest-first display.
  const periods = useMemo(
    () => [...(logPeriodSummariesData?.data ?? [])].reverse(),
    [logPeriodSummariesData?.data]
  )

  const [downloadModalDismissed, setDownloadModalDismissed] = useState(false)

  const showRequiredDownloadModal =
    !isLoadingAccessControlSettings &&
    requireDownloadSetting &&
    periods.length > 1 &&
    !downloadModalDismissed

  const {
    selectedIds,
    isAllSelected,
    isSomeSelected,
    toggleAll: handleToggleAll,
    toggleOne: togglePeriod,
  } = useRecordSelection(periods)

  const requiredDownloadPeriods = useMemo(() => {
    return periods.filter(period => period.endedAt != null)
  }, [periods])

  const selectedPeriods = useMemo(
    () => periods.filter(period => selectedIds.has(period.id)),
    [periods, selectedIds]
  )

  const [showDeleteRecordsModal, setShowDeleteRecordsModal] =
    useState<boolean>(false)
  const [isAuthorizing, setIsAuthorizing] = useState(false)

  const handleNoLogsSelected = useCallback(
    (type: 'delete' | 'download'): void => {
      makeToast(t(`select_entry_to_${type}`) as string, WARNING_TOAST, {
        closeButton: true,
      })
    },
    [t, makeToast]
  )

  const handleDownload = useCallback(
    async (logPeriods: LogPeriodSummary[]): Promise<void> => {
      if (logPeriods.length === 0) {
        handleNoLogsSelected('download')
        return
      }
      if (downloadLogPeriodsMutation.status !== 'loading') {
        const toastIcon: IconProps = { name: 'ot-spinner', spin: true }
        const toastId = makeToast(
          t('downloading_log_periods') as string,
          INFO_TOAST,
          {
            disableTimeout: true,
            icon: toastIcon,
            ...TOAST_STYLE,
          }
        )
        await downloadLogPeriodsMutation
          .mutateAsync({ logPeriods })
          .then(() => {
            makeToast(
              t('files_successfully_downloaded') as string,
              SUCCESS_TOAST,
              TOAST_STYLE
            )
          })
          .catch((error: Error) => {
            makeToast(error.message, ERROR_TOAST, TOAST_STYLE)
          })
          .finally(() => {
            eatToast(toastId)
          })
      }
    },
    [downloadLogPeriodsMutation, t, makeToast, eatToast, handleNoLogsSelected]
  )

  const handleClickDeleteSelected = (): void => {
    if (selectedIds.size === 0) {
      handleNoLogsSelected('delete')
      return
    }
    setShowDeleteRecordsModal(true)
  }

  const handleConfirmDelete = useCallback(
    async (
      logPeriods: LogPeriodSummary[],
      showModal: boolean
    ): Promise<void> => {
      if (showModal) {
        setShowDeleteRecordsModal(false)
      }
      const restoreDeleteModal = (): void => {
        if (showModal) {
          setShowDeleteRecordsModal(true)
        }
      }
      setIsAuthorizing(true)
      try {
        await ensureAuthorized()
      } catch (error) {
        if (!isDocumentedMutationError(error)) {
          makeToast((error as Error).message, ERROR_TOAST)
        }
        restoreDeleteModal()
        return
      } finally {
        setIsAuthorizing(false)
      }
      void downloadLogPeriodsMutation
        .mutateAsync({ logPeriods })
        .then(downloadedPeriods => {
          // only chain a delete for periods that actually came back with a
          // deletion key; a period downloaded without one can't be deleted yet
          const deletableDownloads = downloadedPeriods.filter(
            (
              downloaded
              // enforcing that deletionKey is non-null
            ): downloaded is DownloadedLogPeriod & { deletionKey: string } =>
              downloaded.deletionKey != null
          )
          if (deletableDownloads.length < logPeriods.length) {
            makeToast(t('some_logs_not_deleted') as string, WARNING_TOAST, {
              closeButton: true,
            })
          }
          if (deletableDownloads.length === 0) {
            return
          }
          const deletionKeysByLogPeriodId = deletableDownloads.reduce<
            Record<string, string>
          >((acc, { logPeriod, deletionKey }) => {
            acc[logPeriod.id] = deletionKey
            return acc
          }, {})
          return deleteSelectedLogPeriods(
            deletableDownloads.map(({ logPeriod }) => logPeriod),
            deletionKeysByLogPeriodId
          )
        })
        .catch((e: Error) => {
          if (!isDocumentedMutationError(e)) {
            makeToast(
              getAuditLogDeleteErrorMessage(
                e,
                t(
                  'access_control:delete_audit_logs_permission_required'
                ) as string,
                e.message
              ),
              ERROR_TOAST
            )
          } else {
            restoreDeleteModal()
          }
        })
    },
    [
      deleteSelectedLogPeriods,
      downloadLogPeriodsMutation,
      ensureAuthorized,
      makeToast,
      t,
    ]
  )

  const handleDownloadSelected = useCallback(async (): Promise<void> => {
    await handleDownload(selectedPeriods)
  }, [handleDownload, selectedPeriods])
  const handleConfirmDeleteSelected = useCallback(async (): Promise<void> => {
    await handleConfirmDelete(selectedPeriods, true)
  }, [handleConfirmDelete, selectedPeriods])

  const handleDownloadAndDeleteRequired =
    useCallback(async (): Promise<void> => {
      await handleConfirmDelete(requiredDownloadPeriods, false)
    }, [handleConfirmDelete, requiredDownloadPeriods])

  const [width, setWidth] = useState(0)

  // width updates on mount only right now; known limitation that should be fine in practice
  useEffect(() => {
    if (observer.current != null) {
      // Get the width of the element
      const currentWidth = observer.current.getBoundingClientRect().width
      setWidth(currentWidth)
    }
  }, [])

  // loading skeleton since log period summary query can take a noticeable amount of time
  const skeletonContent = (
    <div className={styles.skeleton_container} ref={observer}>
      <Skeleton width="100%" height="3rem" backgroundSize={`${width}px`} />
      <Skeleton width="100%" height="3rem" backgroundSize={`${width}px`} />
      <Skeleton width="100%" height="3rem" backgroundSize={`${width}px`} />
      <Skeleton width="100%" height="3rem" backgroundSize={`${width}px`} />
    </div>
  )
  const header = (
    <div className={styles.compliance_table_header_row}>
      <CheckboxBasic
        checked={isSomeSelected ? 'indeterminate' : isAllSelected}
        onChange={handleToggleAll}
      />

      <div className={styles.log_period_columns}>
        <StyledText
          desktopStyle="bodyDefaultRegular"
          className={styles.log_date_col}
        >
          {t('protocol')}
        </StyledText>
        <StyledText
          desktopStyle="bodyDefaultRegular"
          className={styles.log_date_col}
        >
          {t('log_period_start')}
        </StyledText>
        <StyledText
          desktopStyle="bodyDefaultRegular"
          className={styles.log_date_col}
        >
          {t('log_period_end')}
        </StyledText>
      </div>
    </div>
  )

  let content: ReactNode = <></>
  if (logPeriodSummaryStatus === 'loading') {
    content = (
      <div className={fileManagerStyles.log_table}>
        {header}
        {skeletonContent}
      </div>
    )
  } else if (logPeriodSummariesData?.data.length === 0) {
    content = <InfoScreen content={t('no_user_action_logs')} />
  } else {
    content = (
      <div className={fileManagerStyles.log_table}>
        {header}
        {periods.map(period => (
          <LogPeriodRow
            key={period.id}
            period={period}
            isSelected={selectedIds.has(period.id)}
            isDeleting={deletingIds.has(period.id)}
            onToggle={() => {
              togglePeriod(period.id)
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <>
      {showDeleteRecordsModal && (
        <DeleteRecordsModal
          onClose={() => {
            setShowDeleteRecordsModal(false)
          }}
          onConfirm={handleConfirmDeleteSelected}
          type="selectedLogs"
        />
      )}
      {showRequiredDownloadModal && (
        <DownloadAuditLogsModal
          onDownload={handleDownloadAndDeleteRequired}
          isLoading={
            isAuthorizing || downloadLogPeriodsMutation.isLoading || isDeleting
          }
          onClose={() => {
            setDownloadModalDismissed(true)
          }}
          closeOnOutsideClick
        />
      )}
      <div className={fileManagerStyles.file_management_group}>
        <FileManagementSectionHeader
          titleText={t('audit_logs')}
          showButtons={isSomeSelected || isAllSelected}
          onDownloadSelected={handleDownloadSelected}
          onDeleteSelected={handleClickDeleteSelected}
        />
        {content}
      </div>
    </>
  )
}
