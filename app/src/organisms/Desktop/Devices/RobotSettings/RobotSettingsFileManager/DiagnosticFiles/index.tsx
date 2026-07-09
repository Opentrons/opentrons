import { useTranslation } from 'react-i18next'

import {
  CheckboxBasic,
  COLORS,
  StyledText,
  WARNING_TOAST,
} from '@opentrons/components'

import {
  useDownloadCalibrationData,
  useDownloadRobotLogs,
} from '/app/organisms/Desktop/Devices/hooks'
import { useToaster } from '/app/organisms/ToasterOven'

import { FileManagementSectionHeader } from '../FileManagementSectionHeader'
import { useRecordSelection } from '../hooks/useRecordSelection'
import fileManagerStyles from '../robotsettingsfilemanager.module.css'
import styles from './diagnosticfiles.module.css'

const DIAGNOSTIC_ROWS = [
  { id: 'troubleshooting', i18nKey: 'troubleshooting_logs' },
  { id: 'calibration', i18nKey: 'calibration_logs' },
]

interface DiagnosticsFilesProps {
  robotName: string
}

export function DiagnosticsFiles({
  robotName,
}: DiagnosticsFilesProps): JSX.Element {
  const { t } = useTranslation('device_details')
  const { makeToast } = useToaster()

  const { downloadLogs } = useDownloadRobotLogs(robotName)
  const { downloadCalibration } = useDownloadCalibrationData(robotName)

  const { selectedIds, isAllSelected, isSomeSelected, toggleAll, toggleOne } =
    useRecordSelection(DIAGNOSTIC_ROWS)

  const handleDownloadSelected = (): void => {
    if (selectedIds.size === 0) {
      makeToast(t('select_entry_to_download') as string, WARNING_TOAST)
      return
    }
    if (selectedIds.has('troubleshooting')) {
      downloadLogs()
    }
    if (selectedIds.has('calibration')) {
      downloadCalibration()
    }
  }

  return (
    <div className={fileManagerStyles.file_management_group}>
      <FileManagementSectionHeader
        titleText={t('diagnostic_files')}
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
