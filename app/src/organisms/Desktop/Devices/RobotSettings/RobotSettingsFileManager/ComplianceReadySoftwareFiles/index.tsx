import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  CheckboxBasic,
  COLORS,
  InfoScreen,
  ListAccordion,
  StyledText,
  Tag,
  WARNING_TOAST,
} from '@opentrons/components'
import { useLogPeriodSummariesQuery } from '@opentrons/react-api-client'

import { useToaster } from '/app/organisms/ToasterOven'
import { formatTimestamp } from '/app/transformations/runs'

import { DeleteRecordsModal } from '../../../DeleteRecordsModal'
import { FileManagementSectionHeader } from '../FileManagementSectionHeader'
import { useRecordSelection } from '../hooks/useRecordSelection'
import fileManagerStyles from '../robotsettingsfilemanager.module.css'
import styles from './compliancereadysoftwarefiles.module.css'
import { LogPeriodRow } from './LogPeriodRow'

export function ComplianceReadySoftwareFiles(): JSX.Element {
  const { t } = useTranslation('device_details')
  const { makeToast } = useToaster()
  const { data: logPeriodSummariesData } = useLogPeriodSummariesQuery()

  // API returns periods oldest-to-newest; reverse for newest-first display.
  const periods = useMemo(
    () => [...(logPeriodSummariesData?.data ?? [])].reverse(),
    [logPeriodSummariesData?.data]
  )

  const {
    selectedIds,
    isAllSelected,
    isSomeSelected,
    toggleAll,
    toggleOne: togglePeriod,
  } = useRecordSelection(periods)

  const [showDeleteRecordsModal, setShowDeleteRecordsModal] =
    useState<boolean>(false)

  // Sorted newest-first; oldest is last in array, newest is first
  const oldestPeriod = periods.at(-1)
  const newestPeriod = periods[0]
  const firstDate =
    oldestPeriod?.startedAt != null
      ? formatTimestamp(oldestPeriod.startedAt)
      : t('na')
  const lastDate =
    newestPeriod != null
      ? formatTimestamp(newestPeriod.endedAt ?? newestPeriod.startedAt)
      : t('na')

  const handleDownloadSelected = (): void => {
    if (selectedIds.size > 0) {
      // TODO: useDownloadLogPeriodMutation
    } else {
      makeToast(t('select_entry_to_download') as string, WARNING_TOAST, {
        closeButton: true,
      })
    }
  }

  const handleDeleteSelected = (): void => {
    if (selectedIds.size === 0) {
      makeToast(t('select_entry_to_delete') as string, WARNING_TOAST, {
        closeButton: true,
      })
      return
    }
    setShowDeleteRecordsModal(true)
  }
  const periodHeaderKeys: Array<'started' | 'ended' | 'status'> = [
    'started',
    'ended',
    'status',
  ]

  return (
    <>
      {showDeleteRecordsModal && (
        <DeleteRecordsModal
          onClose={() => {
            setShowDeleteRecordsModal(false)
          }}
          onConfirm={() => {
            // TODO: delete all selected log periods
            setShowDeleteRecordsModal(false)
          }}
          type="selectedLogs"
        />
      )}
      <div className={fileManagerStyles.file_management_group}>
        <FileManagementSectionHeader
          titleText={t('compliance_ready_software_files')}
          onDownloadSelected={handleDownloadSelected}
          onDeleteSelected={handleDeleteSelected}
        />
        {periods.length === 0 ? (
          <InfoScreen content={t('no_user_action_logs')} />
        ) : (
          <div className={fileManagerStyles.log_table}>
            <div className={styles.compliance_table_header_row}>
              {periodHeaderKeys.map(key => (
                <StyledText
                  key={key}
                  desktopStyle="bodyDefaultRegular"
                  className={styles.log_date_col}
                >
                  {t(key)}
                </StyledText>
              ))}
            </div>

            <ListAccordion
              alertKind="default"
              tableHeaders={undefined}
              icon={
                <div
                  className={styles.compliance_checkbox_wrapper}
                  onClick={e => {
                    e.stopPropagation()
                  }}
                >
                  <CheckboxBasic
                    checked={isSomeSelected ? 'indeterminate' : isAllSelected}
                    onChange={toggleAll}
                    backgroundColor={COLORS.white}
                  />
                </div>
              }
              headerChild={
                <div className={styles.compliance_accordion_content}>
                  <StyledText
                    desktopStyle="bodyDefaultRegular"
                    className={styles.log_file_col}
                  >
                    {t('user_action_logs')}
                  </StyledText>
                  <div className={styles.log_date_col}>
                    <Tag text={firstDate} type="default" shrinkToContent />
                  </div>
                  <div className={styles.log_date_col}>
                    <Tag text={lastDate} type="default" shrinkToContent />
                  </div>
                </div>
              }
            >
              <div className={styles.compliance_period_col_headers}>
                <StyledText
                  desktopStyle="bodyDefaultRegular"
                  className={styles.log_date_col}
                >
                  {t('started')}
                </StyledText>
                <StyledText
                  desktopStyle="bodyDefaultRegular"
                  className={styles.log_date_col}
                >
                  {t('ended')}
                </StyledText>
                <StyledText
                  desktopStyle="bodyDefaultRegular"
                  className={styles.log_date_col}
                >
                  {t('status')}
                </StyledText>
              </div>
              {periods.map(period => (
                <LogPeriodRow
                  key={period.id}
                  period={period}
                  isSelected={selectedIds.has(period.id)}
                  onToggle={() => {
                    togglePeriod(period.id)
                  }}
                />
              ))}
            </ListAccordion>
          </div>
        )}
      </div>
    </>
  )
}
