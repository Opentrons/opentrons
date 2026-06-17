import { useTranslation } from 'react-i18next'

import { ListAccordion, StyledText } from '@opentrons/components'

import styles from './compliancereadysoftwaresettings.module.css'

import type { JSX } from 'react'

export interface ComplianceReadySoftwareSettingsProps {
  robotName: string
}

export function ComplianceReadySoftwareSettings({
  robotName: _robotName,
}: ComplianceReadySoftwareSettingsProps): JSX.Element {
  const { t } = useTranslation('access_control')

  return (
    <div className={styles.accordion}>
      <ListAccordion
        alertKind="default"
        headerChild={
          <StyledText
            desktopStyle="bodyDefaultSemiBold"
            className={styles.header_text}
          >
            {t('desktop_compliance_ready_software_settings')}
          </StyledText>
        }
        tableHeaders={[]}
      >
        {null}
      </ListAccordion>
    </div>
  )
}
