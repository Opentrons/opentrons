import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

import styles from './compliance_ready_settings.module.css'
import { NumericSettingPage } from './NumericSettingPage'
import { PasswordComplexity } from './PasswordComplexity'
import { SettingsListButton } from './SettingsListButton'

import type { ReactNode } from 'react'
import type { AuthSettingsData } from '@opentrons/api-client'

type CRSLoginSettingsPages =
  'max_logins' | 'password_reset_time' | 'password_complexity' | 'idle_logout'

export function LoginSettings({
  authSettings,
  onClickBack,
}: {
  authSettings?: AuthSettingsData
  onClickBack: () => void
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
      title: t('maximum_login_attempts_before_account_deactivation'),
      value: authSettings?.maxNumberOfLoginAttempts,
      units: t('logins'),
    },
    password_reset_time: {
      title: t('require_password_change_after_time'),
      value: authSettings?.passwordResetTime,
      units: t('days'),
    },
    password_complexity: {
      title: t('password_complexity_requirements'),
      value: authSettings?.passwordComplexityMinimumLength,
      units: 'bool',
    },
    idle_logout: {
      title: t('auto_logout_inactivity_length'),
      value: authSettings?.idleLogout,
      units: t('mins'),
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
          title={t('maximum_login_attempts')}
          description={t('maximum_login_attempts_before_account_deactivation')}
          value={authSettings?.maxNumberOfLoginAttempts}
          label={t('number_of_logins')}
          onBack={value => {
            console.log(value)
            setCurrentPage(null)
          }}
        />
      )
    case 'idle_logout':
      return (
        <NumericSettingPage
          title={t('auto_logout')}
          description={t('auto_logout_inactivity_length')}
          value={authSettings?.idleLogout}
          label={t('number_of_minutes')}
          onBack={value => {
            console.log(value)
            setCurrentPage(null)
          }}
        />
      )
    case 'password_complexity':
      return (
        <PasswordComplexity
          onClickBack={() => {
            setCurrentPage(null)
          }}
          authSettings={authSettings}
        />
      )
    default:
      return (
        <div className={styles.container}>
          <ChildNavigation
            header={t('login_title')}
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
