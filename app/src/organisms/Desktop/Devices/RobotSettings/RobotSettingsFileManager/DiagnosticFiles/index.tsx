import { useTranslation } from 'react-i18next'

import { CheckboxBasic, COLORS, StyledText } from '@opentrons/components'

import {
  useDownloadCalibrationData,
  useDownloadRobotLogs,
} from '/app/resources/devices/hooks'

import { FileManagementSectionHeader } from '../FileManagementSectionHeader'
import { useRecordSelection } from '../hooks/useRecordSelection'
import fileManagerStyles from '../robotsettingsfilemanager.module.css'
import styles from './diagnosticfiles.module.css'

import type { ReactNode } from 'react'

const DIAGNOSTIC_ROWS = [
  { id: 'troubleshooting', i18nKey: 'troubleshooting_logs' },
  { id: 'calibration', i18nKey: 'calibration_logs' },
]

interface DiagnosticsFilesProps {
  robotName: string
}

export function DiagnosticsFiles({
  robotName,
}: DiagnosticsFilesProps): ReactNode {
  const { t } = useTranslation('device_details')

  const { downloadLogs, isDownloading: isDownloadingLogs } =
    useDownloadRobotLogs(robotName)
  const { downloadCalibration, isLoading: isLoadingCalibration } =
    useDownloadCalibrationData(robotName)

  const { selectedIds, isAllSelected, isSomeSelected, toggleAll, toggleOne } =
    useRecordSelection(DIAGNOSTIC_ROWS)

  const handleDownloadSelected = (): void => {
    if (selectedIds.has('troubleshooting') && !isDownloadingLogs) {
      downloadLogs().catch(() => {})
    }
    if (selectedIds.has('calibration') && !isLoadingCalibration) {
      downloadCalibration().catch(() => {})
    }
  }

  return (
    <div className={fileManagerStyles.file_management_group}>
      <FileManagementSectionHeader
        titleText={t('diagnostic_files')}
        showButtons={isSomeSelected || isAllSelected}
        onDownloadSelected={handleDownloadSelected}
      />
      <div className={fileManagerStyles.log_table}>
        <div className={styles.header_row}>
          <CheckboxBasic
            checked={isSomeSelected ? 'indeterminate' : isAllSelected}
            onChange={toggleAll}
            backgroundColor={COLORS.white}
          />
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('file_type')}
          </StyledText>
        </div>
        {DIAGNOSTIC_ROWS.map(row => (
          <div key={row.id} className={styles.data_row}>
            <CheckboxBasic
              checked={selectedIds.has(row.id)}
              onChange={() => {
                toggleOne(row.id)
              }}
              backgroundColor={COLORS.white}
            />
            <StyledText desktopStyle="bodyDefaultRegular">
              {t(row.i18nKey)}
            </StyledText>
          </div>
        ))}
      </div>
    </div>
  )
}
