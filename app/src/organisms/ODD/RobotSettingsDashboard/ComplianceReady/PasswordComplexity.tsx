import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { COLORS, StyledText } from '@opentrons/components'

import { SmallButton } from '/app/atoms/buttons'
import { OddModal } from '/app/molecules/OddModal'

import { ChildNavigation } from '../../ChildNavigation'
import styles from './compliance_ready_settings.module.css'
import { NumericSettingPage } from './NumericSettingPage'
import { SettingsListButton } from './SettingsListButton'
import { ToggleSetting } from './ToggleSetting'

import type { ReactNode } from 'react'
import type { AuthSettingsData } from '@opentrons/api-client'

export function PasswordComplexity({
  onClickBack,
  authSettings,
}: {
  onClickBack: () => void
  authSettings?: AuthSettingsData
}): ReactNode {
  const { t } = useTranslation('device_settings')
  const [showMinLength, setShowMinLength] = useState(false)
  const [showWarningModal, setShowWarningModal] = useState(false)

  const passwordComplexityEnabled =
    authSettings?.passwordComplexityMinimumLength != null ||
    authSettings?.passwordComplexitySpecialCharacters != null

  if (showMinLength) {
    return (
      <NumericSettingPage
        title={t('minimum_password_length')}
        value={authSettings?.passwordComplexityMinimumLength ?? 1}
        label={t('number_of_characters')}
        caption={t('input_range')}
        onBack={() => {
          setShowMinLength(false)
        }}
        min={1}
        max={256}
      />
    )
  }

  const warningModal = (
    <OddModal
      header={{
        title: t('require_password_complexity_modal_title'),
        iconName: 'alert',
        iconColor: COLORS.yellow50,
      }}
      modalSize="small"
    >
      <StyledText oddStyle="level4HeaderRegular">
        {t('require_password_complexity_modal_description')}
      </StyledText>
      <div className={styles.warning_modal_buttons}>
        <SmallButton
          buttonText={t('cancel')}
          onClick={() => {
            setShowWarningModal(false)
          }}
          width="50%"
        />
        <SmallButton
          buttonText={t('confirm')}
          onClick={() => {
            setShowWarningModal(false)
          }}
          width="50%"
        />
      </div>
    </OddModal>
  )

  return (
    <>
      {showWarningModal && warningModal}
      <div className={styles.container}>
        <ChildNavigation
          header={t('password_complexity_requirements')}
          onClickBack={onClickBack}
        />
        <div className={styles.password_complexity_content}>
          <ToggleSetting
            title={t('password_complexity_requirements')}
            value={passwordComplexityEnabled}
            onClick={() => {
              setShowWarningModal(true)
            }}
          />
          {passwordComplexityEnabled && (
            <div className={styles.settings_preferences}>
              <StyledText oddStyle="level4HeaderSemiBold">
                {t('preferences')}
              </StyledText>
              <div className={styles.settings_preferences_list}>
                <ToggleSetting
                  title={t('require_special_characters')}
                  value={true}
                  onClick={() => {}}
                />
                <SettingsListButton
                  key={t('minimum_password_length')}
                  title={t('minimum_password_length')}
                  value={`${authSettings?.passwordComplexityMinimumLength ?? 1} ${t('characters')}`}
                  onClick={() => {
                    setShowMinLength(true)
                  }}
                  chevron
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
