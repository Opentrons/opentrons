import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

import styles from './compliance_ready_settings.module.css'
import { NumericSettingPage } from './NumericSettingPage'
import { PasswordChange } from './PasswordChange'
import { PasswordComplexity } from './PasswordComplexity'
import { SettingsListButton } from './SettingsListButton'

import type { ReactNode } from 'react'
import type { AuthSettingsData } from '@opentrons/api-client'

type CRSLoginSettingsPages =
  'max_logins' | 'password_reset_time' | 'password_complexity' | 'idle_logout'

export function LoginSettings({
  authSettings,
  onClickBack,
  patchAuthSettings,
}: {
  authSettings?: AuthSettingsData
  onClickBack: () => void
  patchAuthSettings: (authSettings: Partial<AuthSettingsData>) => void
}): ReactNode {
  const { t } = useTranslation('device_settings')

  const CRSLoginSettings: Record<
    CRSLoginSettingsPages,
    {
      title: string
      value: number | boolean | null | undefined
      units: string
    }
  > = {
    max_logins: {
      title: t('odd_maximum_login_attempts_before_account_deactivation'),
      value: authSettings?.maxNumberOfLoginAttempts,
      units: t('odd_logins'),
    },
    password_reset_time: {
      title: t('odd_require_password_change_after_time'),
      value: Math.round((authSettings?.passwordResetTime ?? 0) / 86400),
      units: t('odd_days'),
    },
    password_complexity: {
      title: t('odd_password_complexity_requirements'),
      value: authSettings?.passwordComplexityMinimumLength,
      units: 'bool',
    },
    idle_logout: {
      title: t('odd_auto_logout_inactivity_length'),
      value: Math.round((authSettings?.idleLogout ?? 0) / 60),
      units: t('odd_minutes'),
    },
  }

  const [currentPage, setCurrentPage] = useState<CRSLoginSettingsPages | null>(
    null
  )

  const pages = Object.keys(CRSLoginSettings) as CRSLoginSettingsPages[]

  switch (currentPage) {
    case 'max_logins':
      return (
        <NumericSettingPage
          title={t('odd_maximum_login_attempts')}
          description={t(
            'odd_maximum_login_attempts_before_account_deactivation'
          )}
          value={authSettings?.maxNumberOfLoginAttempts}
          label={t('odd_number_of_logins')}
          onBack={value => {
            patchAuthSettings({ maxNumberOfLoginAttempts: value })
            setCurrentPage(null)
          }}
          min={1}
          max={5}
        />
      )
    case 'password_reset_time':
      return (
        <PasswordChange
          onClickBack={() => {
            setCurrentPage(null)
          }}
          authSettings={authSettings}
          patchAuthSettings={patchAuthSettings}
        />
      )
    case 'idle_logout':
      return (
        <NumericSettingPage
          title={t('odd_auto_logout')}
          description={t('odd_auto_logout_inactivity_length')}
          value={Math.round((authSettings?.idleLogout ?? 0) / 60)}
          label={t('odd_number_of_minutes')}
          onBack={value => {
            patchAuthSettings({ idleLogout: value ? value * 60 : undefined })
            setCurrentPage(null)
          }}
          min={1}
        />
      )
    case 'password_complexity':
      return (
        <PasswordComplexity
          onClickBack={() => {
            setCurrentPage(null)
          }}
          authSettings={authSettings}
          patchAuthSettings={patchAuthSettings}
        />
      )
    default:
      return (
        <div className={styles.container}>
          <ChildNavigation
            header={t('odd_login_title')}
            onClickBack={onClickBack}
          />
          <div className={styles.content}>
            <div className={styles.settings_list}>
              {pages.map(page => {
                const { title, value, units } = CRSLoginSettings[page]

                const valueText =
                  units === 'bool'
                    ? value
                      ? t('on')
                      : t('off')
                    : !!value
                      ? `${value} ${units}`
                      : t('off')
                return (
                  <SettingsListButton
                    key={page}
                    title={title}
                    value={valueText}
                    onClick={() => {
                      setCurrentPage(page)
                    }}
                    chevron
                  />
                )
              })}
            </div>
          </div>
        </div>
      )
  }
}
