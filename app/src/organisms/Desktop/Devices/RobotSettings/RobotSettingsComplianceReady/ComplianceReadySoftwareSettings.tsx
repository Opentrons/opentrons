import { useTranslation } from 'react-i18next'

import { Accordion } from '/app/molecules/Accordion'

import type { JSX } from 'react'

export interface ComplianceReadySoftwareSettingsProps {
  robotName: string
}

export function ComplianceReadySoftwareSettings({
  robotName: _robotName,
}: ComplianceReadySoftwareSettingsProps): JSX.Element {
  const { t } = useTranslation('access_control')

  return (
    <Accordion title={t('desktop_compliance_ready_software_settings')} />
  )
}
