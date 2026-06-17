import { useTranslation } from 'react-i18next'

import { StyledText } from '@opentrons/components'

import { Accordion } from '/app/molecules/Accordion'

import type { JSX } from 'react'

export interface ComplianceReadySoftwareSettingsProps {
  robotName: string
}

export function ComplianceReadySoftwareSettings({
  robotName: _robotName,
}: ComplianceReadySoftwareSettingsProps): JSX.Element {
  const { t } = useTranslation('access_control')

  const children = (
    <div>
      <StyledText desktopStyle="bodyDefaultSemiBold">{t('desktop_login_and_security')}</StyledText>
    </div>
  )

  return (
    <Accordion title={t('desktop_compliance_ready_software_settings')}>{children}</Accordion>
  )
}
