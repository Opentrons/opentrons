import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Divider, StyledText } from '@opentrons/components'

import { Accordion } from '/app/molecules/Accordion'
import { InputSetting } from '/app/molecules/InputSetting'

import styles from './compliancereadysoftwaresettings.module.css'

import type { JSX } from 'react'

export interface ComplianceReadySoftwareSettingsProps {
  robotName: string
}

export function ComplianceReadySoftwareSettings({
  robotName: _robotName,
}: ComplianceReadySoftwareSettingsProps): JSX.Element {
  const { t } = useTranslation('access_control')
  const [loginAttempts, setLoginAttempts] = useState('')
  const [autoLogoutMinutes, setAutoLogoutMinutes] = useState('')

  const children = (
    <div className={styles.content}>
      <StyledText desktopStyle="bodyDefaultSemiBold">
        {t('desktop_login_and_security')}
      </StyledText>
      <div className={styles.field_list}>
        <InputSetting
          label={t('desktop_maximum_login_attempts_before_account_deactivation')}
          value={loginAttempts}
          units={t('desktop_logins')}
          onChange={event => {
            setLoginAttempts(event.target.value)
          }}
        />
        <Divider />
        <InputSetting
          label={t('desktop_auto_logout_inactivity_length')}
          value={autoLogoutMinutes}
          units={t('desktop_minutes')}
          onChange={event => {
            setAutoLogoutMinutes(event.target.value)
          }}
        />
      </div>
    </div>
  )

  return (
    <Accordion title={t('desktop_compliance_ready_software_settings')}>
      {children}
    </Accordion>
  )
}
