import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { COLORS, StyledText } from '@opentrons/components'

import { SmallButton } from '/app/atoms/buttons'
import { OddModal } from '/app/molecules/OddModal'
import { DEFAULT_MIN_PASSWORD_LENGTH } from '/app/resources/auth'
import {
  isValidPasswordComplexityMinimumLength,
  MAX_PASSWORD_COMPLEXITY_MINIMUM_LENGTH,
} from '/app/resources/auth/helpers'

import { ChildNavigation } from '../../ChildNavigation'
import styles from './compliance_ready_settings.module.css'
import {
  DEFAULT_PASSWORD_COMPLEXITY_DISABLED_SETTINGS,
  DEFAULT_PASSWORD_COMPLEXITY_SETTINGS,
  MIN_PASSWORD_COMPLEXITY_MINIMUM_LENGTH,
} from './constants'
import { NumericSettingPage } from './NumericSettingPage'
import { SettingsListButton } from './SettingsListButton'
import { ToggleSetting } from './ToggleSetting'

import type { ReactNode } from 'react'
import type { AuthSettingsData } from '@opentrons/api-client'

type PasswordComplexitySettings = Pick<
  AuthSettingsData,
  'passwordComplexityMinimumLength' | 'passwordComplexitySpecialCharacters'
>

export function PasswordComplexity({
  onClickBack,
  authSettings,
  patchAuthSettings,
}: {
  onClickBack: () => void
  authSettings?: AuthSettingsData
  patchAuthSettings: (settings: Partial<AuthSettingsData>) => void
}): ReactNode {
  const { t } = useTranslation('device_settings')
  const [showMinLength, setShowMinLength] = useState(false)
  const [showWarningModal, setShowWarningModal] = useState(false)

  const passwordComplexitySettings: PasswordComplexitySettings = useMemo(
    () => ({
      passwordComplexityMinimumLength:
        authSettings?.passwordComplexityMinimumLength ?? null,
      passwordComplexitySpecialCharacters:
        authSettings?.passwordComplexitySpecialCharacters ?? false,
    }),
    [authSettings]
  )

  const [tempAuthSettings, setTempAuthSettings] =
    useState<PasswordComplexitySettings>(passwordComplexitySettings)

  const isEditing = !settingsAreEqual(
    passwordComplexitySettings,
    tempAuthSettings
  )

  const passwordComplexityEnabled =
    tempAuthSettings.passwordComplexityMinimumLength != null ||
    !!tempAuthSettings.passwordComplexitySpecialCharacters

  const handleConfirm = useCallback(() => {
    if (
      hasPasswordComplexityIncreased(
        passwordComplexitySettings,
        tempAuthSettings
      )
    ) {
      setShowWarningModal(true)
    } else {
      patchAuthSettings(tempAuthSettings)
    }
  }, [passwordComplexitySettings, tempAuthSettings, patchAuthSettings])

  if (showMinLength) {
    return (
      <NumericSettingPage
        title={t('odd_minimum_password_length')}
        value={
          tempAuthSettings?.passwordComplexityMinimumLength ??
          MIN_PASSWORD_COMPLEXITY_MINIMUM_LENGTH
        }
        label={t('odd_number_of_characters')}
        caption={t('odd_input_range')}
        onBack={value => {
          if (
            value != null &&
            isValidPasswordComplexityMinimumLength(String(value))
          ) {
            setTempAuthSettings(prev => ({
              ...prev,
              passwordComplexityMinimumLength: value,
            }))
          }
          setShowMinLength(false)
        }}
        min={MIN_PASSWORD_COMPLEXITY_MINIMUM_LENGTH}
        max={MAX_PASSWORD_COMPLEXITY_MINIMUM_LENGTH}
      />
    )
  }

  const warningModal = (
    <OddModal
      header={{
        title: t('odd_require_password_complexity_modal_title'),
        iconName: 'information',
        iconColor: COLORS.yellow50,
      }}
      modalSize="medium"
    >
      <div className={styles.warning_modal_content}>
        <StyledText oddStyle="level4HeaderRegular">
          {t('odd_require_password_complexity_modal_description')}
        </StyledText>
        <div className={styles.warning_modal_buttons}>
          <SmallButton
            buttonText={t('cancel')}
            onClick={() => {
              setShowWarningModal(false)
            }}
            width="50%"
            buttonType="secondary"
          />
          <SmallButton
            buttonText={t('confirm')}
            onClick={() => {
              patchAuthSettings(tempAuthSettings)
              setShowWarningModal(false)
            }}
            width="50%"
          />
        </div>
      </div>
    </OddModal>
  )

  return (
    <>
      {showWarningModal && warningModal}
      <div className={styles.container}>
        <ChildNavigation
          header={t('odd_password_complexity_requirements')}
          onClickBack={onClickBack}
          onClickButton={isEditing ? handleConfirm : undefined}
          buttonText={isEditing ? t('confirm') : undefined}
          buttonType="primary"
          // secondaryButtonProps={
          //   isEditing
          //     ? {
          //         buttonText: '' + t('odd_password_cancel_button'),
          //         buttonType: 'tertiaryLowLight',
          //         onClick: () => {
          //           setTempAuthSettings(authSettings)
          //         },
          //       }
          //     : undefined
          // }
        />
        <div className={styles.password_complexity_content}>
          <ToggleSetting
            title={t('odd_password_complexity_requirements')}
            value={passwordComplexityEnabled}
            onClick={() => {
              if (!passwordComplexityEnabled) {
                setTempAuthSettings(DEFAULT_PASSWORD_COMPLEXITY_SETTINGS)
              } else {
                setTempAuthSettings(
                  DEFAULT_PASSWORD_COMPLEXITY_DISABLED_SETTINGS
                )
              }
            }}
          />
          {passwordComplexityEnabled && (
            <div className={styles.settings_preferences}>
              <StyledText oddStyle="level4HeaderSemiBold">
                {t('odd_preferences')}
              </StyledText>
              <div className={styles.settings_preferences_list}>
                <ToggleSetting
                  title={t('odd_require_special_characters')}
                  value={
                    tempAuthSettings.passwordComplexitySpecialCharacters ??
                    false
                  }
                  onClick={() => {
                    setTempAuthSettings(prev => ({
                      ...prev,
                      passwordComplexitySpecialCharacters:
                        !prev.passwordComplexitySpecialCharacters,
                    }))
                  }}
                />
                <SettingsListButton
                  key={t('odd_minimum_password_length')}
                  title={t('odd_minimum_password_length')}
                  value={`${tempAuthSettings?.passwordComplexityMinimumLength ?? DEFAULT_MIN_PASSWORD_LENGTH} ${t('odd_characters')}`}
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

function hasPasswordComplexityIncreased(
  oldSettings: PasswordComplexitySettings,
  newSettings: PasswordComplexitySettings
): boolean {
  const settingsEqual = settingsAreEqual(oldSettings, newSettings)
  const newSettingsEnabled =
    (!oldSettings.passwordComplexityMinimumLength &&
      !!newSettings.passwordComplexityMinimumLength) ||
    (!oldSettings.passwordComplexitySpecialCharacters &&
      !!newSettings.passwordComplexitySpecialCharacters)
  const lengthIncreased =
    (oldSettings.passwordComplexityMinimumLength ?? 0) <
    (newSettings.passwordComplexityMinimumLength ?? 0)
  return !settingsEqual && (newSettingsEnabled || lengthIncreased)
}

function settingsAreEqual(
  oldSettings: PasswordComplexitySettings,
  newSettings: PasswordComplexitySettings
): boolean {
  return (
    oldSettings.passwordComplexityMinimumLength ===
      newSettings.passwordComplexityMinimumLength &&
    oldSettings.passwordComplexitySpecialCharacters ===
      newSettings.passwordComplexitySpecialCharacters
  )
}
