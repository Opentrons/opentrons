import { useTranslation } from 'react-i18next'

import {
  CheckboxBasic,
  COLORS,
  ERROR_TOAST,
  INFO_TOAST,
  StyledText,
  SUCCESS_TOAST,
} from '@opentrons/components'

import { useToaster } from '/app/organisms/ToasterOven'
import {
  useDownloadCalibrationData,
  useDownloadRobotLogs,
} from '/app/resources/devices/hooks'

import { FileManagementSectionHeader } from '../FileManagementSectionHeader'
import { useRecordSelection } from '../hooks/useRecordSelection'
import fileManagerStyles from '../robotsettingsfilemanager.module.css'
import styles from './diagnosticfiles.module.css'

import type { IconProps } from '@opentrons/components'

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
  const { makeToast, eatToast } = useToaster()

  const { mutateAsync: downloadLogs, status: downloadLogsStatus } =
    useDownloadRobotLogs(robotName)
  const { downloadCalibration, isLoading: isLoadingCalibration } =
    useDownloadCalibrationData(robotName)

  const { selectedIds, isAllSelected, isSomeSelected, toggleAll, toggleOne } =
    useRecordSelection(DIAGNOSTIC_ROWS)

  const handleDownloadSelected = (): void => {
    const shouldDownloadLogs =
      selectedIds.has('troubleshooting') && downloadLogsStatus !== 'loading'
    const shouldDownloadCalibration =
      selectedIds.has('calibration') && !isLoadingCalibration

    if (!shouldDownloadLogs && !shouldDownloadCalibration) {
      return
    }

    const toastIcon: IconProps = { name: 'ot-spinner', spin: true }
    const toastId = makeToast(
      t('downloading_diagnostic_files') as string,
      INFO_TOAST,
      { disableTimeout: true, icon: toastIcon }
    )

    const downloads: Array<Promise<unknown>> = []
    if (shouldDownloadLogs) {
      downloads.push(downloadLogs({}))
    }
    if (shouldDownloadCalibration) {
      downloads.push(downloadCalibration())
    }

    void Promise.all(downloads)
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
