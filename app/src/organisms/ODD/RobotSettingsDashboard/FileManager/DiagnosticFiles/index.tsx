import { useTranslation } from 'react-i18next'

import { StyledText } from '@opentrons/components'

import styles from './diagnosticfiles.module.css'

const DIAGNOSTIC_ROWS = [
  { id: 'troubleshooting', i18nKey: 'troubleshooting_logs' },
  { id: 'calibration', i18nKey: 'calibration_logs' },
]

export function DiagnosticFiles(): JSX.Element {
  const { t } = useTranslation('device_details')

  return (
    <div className={styles.container}>
      <div className={styles.header_row}>
        <StyledText oddStyle="bodyTextSemiBold" className={styles.header_label}>
          {t('file_type')}
        </StyledText>
      </div>
      <div className={styles.list}>
        {DIAGNOSTIC_ROWS.map(row => (
          <div key={row.id} className={styles.list_item}>
            <StyledText oddStyle="bodyTextSemiBold">
              {t(row.i18nKey)}
            </StyledText>
          </div>
        ))}
      </div>
    </div>
  )
}
