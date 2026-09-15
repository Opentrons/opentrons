import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { StyledText } from '@opentrons/components'

import { ChildNavigation } from '../../ChildNavigation'
import styles from './compliance_ready_settings.module.css'
import { NumericSettingPage } from './NumericSettingPage'
import { SettingsListButton } from './SettingsListButton'
import { ToggleSetting } from './ToggleSetting'

import type { ReactNode } from 'react'
import type { AuthSettingsData } from '@opentrons/api-client'

export function PasswordChange({
  onClickBack,
  authSettings,
  patchAuthSettings,
}: {
  onClickBack: () => void
  authSettings?: AuthSettingsData
  patchAuthSettings: (settings: Partial<AuthSettingsData>) => void
}): ReactNode {
  const { t } = useTranslation('device_settings')
  const [showLengthOfTime, setShowLengthOfTime] = useState(false)

  const passwordChangeEnabled = !!authSettings?.passwordResetTime

  if (showLengthOfTime) {
    return (
      <NumericSettingPage
        title={t('length_of_time_before_password_change')}
        description={t('length_of_time_before_password_change_description')}
        value={Math.round((authSettings?.passwordResetTime ?? 0) / 86400)}
        label={t('number_of_days')}
        onBack={value => {
          patchAuthSettings({
            passwordResetTime: value ? value * 86400 : undefined,
          })
          setShowLengthOfTime(false)
        }}
        max={3650}
      />
    )
  }

  return (
    <div className={styles.container}>
      <ChildNavigation
        header={t('password_change_requirement')}
        onClickBack={onClickBack}
      />
      <div className={styles.password_complexity_content}>
        <ToggleSetting
          title={t('require_password_changed')}
          value={passwordChangeEnabled}
          onClick={() => {
            if (!passwordChangeEnabled) {
              patchAuthSettings({ passwordResetTime: 30 * 86400 })
            } else {
              patchAuthSettings({
                passwordResetTime: null,
              })
            }
          }}
        />
        {passwordChangeEnabled && (
          <div className={styles.settings_preferences}>
            <StyledText oddStyle="level4HeaderSemiBold">
              {t('preferences')}
            </StyledText>
            <div className={styles.settings_preferences_list}>
              <SettingsListButton
                key={t('just_length_of_time')}
                title={t('just_length_of_time')}
                value={`${Math.round((authSettings?.passwordResetTime ?? 0) / 86400)} ${t('days')}`}
                onClick={() => {
                  setShowLengthOfTime(true)
                }}
                chevron
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
