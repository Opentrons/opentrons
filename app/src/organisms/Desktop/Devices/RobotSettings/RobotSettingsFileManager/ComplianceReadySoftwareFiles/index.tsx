import { useMemo, useState } from 'react'
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
  useLogPeriodSummariesQuery,
} from '@opentrons/react-api-client'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { useToaster } from '/app/organisms/ToasterOven'
import { useDeleteSelectedLogPeriods } from '/app/resources/devices/hooks/useDeleteSelectedLogPeriods'
import { useDownloadSelectedLogPeriods } from '/app/resources/devices/hooks/useDownloadSelectedLogPeriods'

import { DeleteRecordsModal } from '../../../DeleteRecordsModal'
import { FileManagementSectionHeader } from '../FileManagementSectionHeader'
import { useRecordSelection } from '../hooks/useRecordSelection'
import fileManagerStyles from '../robotsettingsfilemanager.module.css'
import styles from './compliancereadysoftwarefiles.module.css'
import { LogPeriodRow } from './LogPeriodRow'

import type { IconProps } from '@opentrons/components'
import type { MakeToastOptions } from '/app/organisms/ToasterOven/ToasterContext'
import type { DownloadedLogPeriod } from '/app/resources/devices/hooks/useDownloadSelectedLogPeriods'

const TOAST_STYLE: MakeToastOptions = {
  closeButton: true,
  width: '80%',
}

interface ComplianceReadySoftwareFilesProps {
  robotName: string
}

export function ComplianceReadySoftwareFiles({
  robotName,
}: ComplianceReadySoftwareFilesProps): JSX.Element {
  const { t } = useTranslation('device_details')
  const { data: logPeriodSummariesData } = useLogPeriodSummariesQuery()
  const documentationState = useDocumentationState()
  const downloadLogPeriodsMutation = useDownloadSelectedLogPeriods(robotName)
  const { deleteSelectedLogPeriods, deletingIds } =
    useDeleteSelectedLogPeriods(documentationState)
  const { makeToast, eatToast } = useToaster()

  // API returns periods oldest-to-newest; reverse for newest-first display.
  const periods = useMemo(
    () => [...(logPeriodSummariesData?.data ?? [])].reverse(),
    [logPeriodSummariesData?.data]
  )

  const {
    selectedIds,
    isAllSelected,
    isSomeSelected,
    toggleAll: handleToggleAll,
    toggleOne: togglePeriod,
  } = useRecordSelection(periods)

  const [showDeleteRecordsModal, setShowDeleteRecordsModal] =
    useState<boolean>(false)

  const handleNoLogsSelected = (type: 'delete' | 'download'): void => {
    makeToast(t(`select_entry_to_${type}`) as string, WARNING_TOAST, {
      closeButton: true,
    })
  }

  const handleDownloadSelected = (): void => {
    if (selectedIds.size === 0) {
      handleNoLogsSelected('download')
      return
    }
    if (downloadLogPeriodsMutation.status !== 'loading') {
      const toastIcon: IconProps = { name: 'ot-spinner', spin: true }
      const toastId = makeToast(
        t('downloading_all_log_periods') as string,
        INFO_TOAST,
        {
          disableTimeout: true,
          icon: toastIcon,
          ...TOAST_STYLE,
        }
      )
      downloadLogPeriodsMutation
        .mutateAsync({
          logPeriods: periods.filter(period => selectedIds.has(period.id)),
        })
        .catch((error: Error) => {
          makeToast(error.message, ERROR_TOAST, TOAST_STYLE)
        })
        .then(() => {
          makeToast(
            t('files_successfully_downloaded') as string,
            SUCCESS_TOAST,
            TOAST_STYLE
          )
        })
        .finally(() => {
          eatToast(toastId)
        })
    }
  }

  const handleClickDeleteSelected = (): void => {
    if (selectedIds.size === 0) {
      handleNoLogsSelected('delete')
      return
    }
    setShowDeleteRecordsModal(true)
  }

  const handleConfirmDeleteSelected = (): void => {
    setShowDeleteRecordsModal(false)
    const selectedPeriods = periods.filter(period => selectedIds.has(period.id))
    void downloadLogPeriodsMutation
      .mutateAsync({ logPeriods: selectedPeriods })
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
        if (deletableDownloads.length < selectedPeriods.length) {
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
          makeToast(e.message, ERROR_TOAST)
        } else {
          // reopen the delete modal if we fail; no flicker in practice
          setShowDeleteRecordsModal(true)
        }
      })
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
      <div className={fileManagerStyles.file_management_group}>
        <FileManagementSectionHeader
          titleText={t('compliance_ready_audit_logs')}
          showButtons={isSomeSelected || isAllSelected}
          onDownloadSelected={handleDownloadSelected}
          onDeleteSelected={handleClickDeleteSelected}
        />
        {periods.length === 0 ? (
          <InfoScreen content={t('no_user_action_logs')} />
        ) : (
          <div className={fileManagerStyles.log_table}>
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
                  {t('log_period_start')}
                </StyledText>
                <StyledText
                  desktopStyle="bodyDefaultRegular"
                  className={styles.log_status_col}
                >
                  {t('status')}
                </StyledText>
              </div>
            </div>
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
        )}
      </div>
    </>
  )
}
