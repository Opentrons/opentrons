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
import { isDocumentedMutationError } from '@opentrons/react-api-client'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { useToaster } from '/app/organisms/ToasterOven'
import {
  useDeleteSelectedRuns,
  useDownloadSelectedRuns,
} from '/app/resources/devices/hooks'
import { useNotifyAllRunsQuery } from '/app/resources/runs'

import { DeleteRecordsModal } from '../../../DeleteRecordsModal'
import { FileManagementSectionHeader } from '../FileManagementSectionHeader'
import { useRecordSelection } from '../hooks/useRecordSelection'
import fileManagerStyles from '../robotsettingsfilemanager.module.css'
import protocolRunRecordsStyles from './protocolrunrecords.module.css'
import { RunRecord } from './RunRecord'

import type { ReactNode } from 'react'
import type { IconProps } from '@opentrons/components'

interface ProtocolRunRecordsProps {
  robotName: string
}

export function ProtocolRunRecords({
  robotName,
}: ProtocolRunRecordsProps): ReactNode {
  const { t } = useTranslation('device_details')
  const { makeToast, eatToast } = useToaster()
  const { data: runData } = useNotifyAllRunsQuery()
  const runs = useMemo(
    () => [...(runData?.data ?? [])].reverse(),
    [runData?.data]
  )
  const documentationState = useDocumentationState()
  const { mutateAsync: downloadSelectedRuns, status: downloadRunsStatus } =
    useDownloadSelectedRuns(robotName)
  const { deleteSelectedRuns, deletingIds } =
    useDeleteSelectedRuns(documentationState)

  const {
    selectedIds,
    isAllSelected,
    isSomeSelected,
    toggleAll: handleToggleAll,
    toggleOne: handleToggleRun,
  } = useRecordSelection(runs)
  const [showDeleteRecordsModal, setShowDeleteRecordsModal] =
    useState<boolean>(false)

  const handleNoRunsSelected = (type: 'delete' | 'download'): void => {
    makeToast(t(`select_entry_to_${type}`) as string, WARNING_TOAST, {
      closeButton: true,
    })
  }

  const handleDownloadSelected = (): void => {
    if (selectedIds.size === 0) {
      handleNoRunsSelected('download')
      return
    }
    if (downloadRunsStatus !== 'loading') {
      const toastIcon: IconProps = { name: 'ot-spinner', spin: true }
      const toastId = makeToast(
        t('downloading_run_records') as string,
        INFO_TOAST,
        { disableTimeout: true, icon: toastIcon }
      )
      void downloadSelectedRuns({
        runs: runs.filter(run => selectedIds.has(run.id)),
      })
        .then(() => {
          makeToast(t('files_successfully_downloaded') as string, SUCCESS_TOAST)
        })
        .catch((e: Error) => {
          makeToast(e.message, ERROR_TOAST, { closeButton: true })
        })
        .finally(() => {
          eatToast(toastId)
        })
    }
  }

  const handleClickDeleteSelected = (): void => {
    if (selectedIds.size === 0) {
      handleNoRunsSelected('delete')
      return
    }
    setShowDeleteRecordsModal(true)
  }

  const handleConfirmDeleteSelected = (): void => {
    setShowDeleteRecordsModal(false)
    const selectedRuns = runs.filter(run => selectedIds.has(run.id))
    void downloadSelectedRuns({ runs: selectedRuns })
      .then(successfullyDownloadedRuns => {
        if (successfullyDownloadedRuns.length < selectedRuns.length) {
          makeToast(t('some_runs_not_deleted') as string, WARNING_TOAST, {
            closeButton: true,
          })
        }
        if (successfullyDownloadedRuns.length === 0) {
          return
        }
        return deleteSelectedRuns(successfullyDownloadedRuns)
      })
      .catch((error: Error) => {
        if (isDocumentedMutationError(error)) {
          // Re-open delete modal if it was a documented mutation error
          setShowDeleteRecordsModal(true)
        } else {
          makeToast(error.message || 'Error processing records', ERROR_TOAST)
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
          type="selectedRuns"
        />
      )}
      <div className={fileManagerStyles.file_management_group}>
        <FileManagementSectionHeader
          titleText={t('protocol_run_records')}
          showButtons={isSomeSelected || isAllSelected}
          onDownloadSelected={handleDownloadSelected}
          onDeleteSelected={handleClickDeleteSelected}
        />
        {runs.length === 0 ? (
          <InfoScreen content={t('no_recent_runs')} />
        ) : (
          <div className={fileManagerStyles.log_table}>
            <div className={protocolRunRecordsStyles.run_records_header_row}>
              <CheckboxBasic
                checked={isSomeSelected ? 'indeterminate' : isAllSelected}
                onChange={handleToggleAll}
              />
              <StyledText
                desktopStyle="bodyDefaultRegular"
                className={protocolRunRecordsStyles.run_date_col}
              >
                {t('date')}
              </StyledText>
              <StyledText
                desktopStyle="bodyDefaultRegular"
                className={protocolRunRecordsStyles.run_protocol_col}
              >
                {t('protocol')}
              </StyledText>
              <StyledText
                desktopStyle="bodyDefaultRegular"
                className={protocolRunRecordsStyles.run_status_col}
              >
                {t('status')}
              </StyledText>
              <StyledText
                desktopStyle="bodyDefaultRegular"
                className={protocolRunRecordsStyles.run_files_col}
              >
                {t('files')}
              </StyledText>
            </div>
            {runs.map(run => (
              <RunRecord
                key={run.id}
                run={run}
                isSelected={selectedIds.has(run.id)}
                isDeleting={deletingIds.has(run.id)}
                onToggle={() => {
                  handleToggleRun(run.id)
                }}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
