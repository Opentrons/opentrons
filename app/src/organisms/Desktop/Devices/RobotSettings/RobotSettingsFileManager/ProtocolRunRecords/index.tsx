import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  CheckboxBasic,
  InfoScreen,
  StyledText,
  WARNING_TOAST,
} from '@opentrons/components'

import { useToaster } from '/app/organisms/ToasterOven'
import { useNotifyAllRunsQuery } from '/app/resources/runs'

import { DeleteRecordsModal } from '../../../DeleteRecordsModal'
import { FileManagementSectionHeader } from '../FileManagementSectionHeader'
import { useRecordSelection } from '../hooks/useRecordSelection'
import fileManagerStyles from '../robotsettingsfilemanager.module.css'
import protocolRunRecordsStyles from './protocolrunrecords.module.css'
import { RunRecord } from './RunRecord'

export function ProtocolRunRecords(): JSX.Element {
  const { t } = useTranslation('device_details')
  const { makeToast } = useToaster()
  const { data: runData } = useNotifyAllRunsQuery()
  const runs = [...(runData?.data ?? [])]

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

  // no-op: download not yet implemented
  const handleDownloadSelected = (): void => {
    if (selectedIds.size === 0) {
      handleNoRunsSelected('download')
    }
  }

  const handleDeleteSelected = (): void => {
    if (selectedIds.size === 0) {
      handleNoRunsSelected('delete')
      return
    }
    setShowDeleteRecordsModal(true)
  }

  return (
    <>
      {showDeleteRecordsModal && (
        <DeleteRecordsModal
          onClose={() => {
            setShowDeleteRecordsModal(false)
          }}
          onConfirm={() => {
            setShowDeleteRecordsModal(false)
          }}
          type="selectedRuns"
        />
      )}
      <div className={fileManagerStyles.file_management_group}>
        <FileManagementSectionHeader
          titleText={t('protocol_run_records')}
          onDownloadSelected={handleDownloadSelected}
          onDeleteSelected={handleDeleteSelected}
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
