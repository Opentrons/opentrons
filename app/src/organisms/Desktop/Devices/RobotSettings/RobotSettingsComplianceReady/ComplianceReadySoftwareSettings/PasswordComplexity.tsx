import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { BORDERS, Divider, PrimaryButton } from '@opentrons/components'

import { TextOnlyButton } from '/app/components/adhoc/shared/buttons/TextOnlyButton'
import {
  DEFAULT_PASSWORD_COMPLEXITY_SETTINGS,
  hasPasswordComplexityIncreased,
  MAX_PASSWORD_COMPLEXITY_MINIMUM_LENGTH,
  MIN_PASSWORD_COMPLEXITY_MINIMUM_LENGTH,
} from '/app/resources/auth'

import { SettingsConfirmationModal } from '../SettingsConfirmationModal'
import styles from './compliancereadysoftwaresettings.module.css'
import { ComplianceReadyToggleField } from './ComplianceReadyToggleField'
import { InputSetting } from './InputSetting'

import type { ReactNode } from 'react'
import type {
  AuthSettingsData,
  PatchAuthSettingsResponse,
} from '@opentrons/api-client'
import type { PasswordComplexitySettings } from '/app/resources/auth'
import type { FieldValues } from './complianceReadySettingsTypes'

type LocalPasswordSettings = Pick<
  FieldValues,
  | 'passwordComplexityEnabled'
  | 'passwordComplexitySpecialCharacters'
  | 'passwordComplexityMinimumLength'
>

export function PasswordComplexity({
  patchAuthSettings,
  fieldValues,
}: {
  patchAuthSettings: (settings: {
    data: Partial<AuthSettingsData>
  }) => Promise<PatchAuthSettingsResponse>
  fieldValues: FieldValues
}): ReactNode {
  const { t } = useTranslation('device_settings')

  const fieldValuesPasswordSettings = useMemo(() => {
    return {
      passwordComplexityEnabled: fieldValues.passwordComplexityEnabled,
      passwordComplexitySpecialCharacters:
        fieldValues.passwordComplexitySpecialCharacters,
      passwordComplexityMinimumLength:
        fieldValues.passwordComplexityMinimumLength,
    }
  }, [fieldValues])

  const [localSettings, setLocalSettings] = useState<LocalPasswordSettings>(
    fieldValuesPasswordSettings
  )
  const [initialSettings, setInitialSettings] = useState<LocalPasswordSettings>(
    fieldValuesPasswordSettings
  )
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)

  const fieldValuesToUse = useMemo(() => {
    return {
      ...fieldValues,
      ...localSettings,
    }
  }, [fieldValues, localSettings])

  const isEditing = !settingsAreEqual(
    fieldValuesPasswordSettings,
    localSettings
  )

  // If local settings arrive late or are updated elsewhere, settings will show up as edited even when they haven't been.
  useEffect(() => {
    if (settingsAreEqual(localSettings, initialSettings) && isEditing) {
      setLocalSettings(fieldValuesPasswordSettings)
    }
    setInitialSettings(fieldValuesPasswordSettings)
  }, [fieldValuesPasswordSettings, initialSettings, isEditing, localSettings])

  const onToggleSpecialCharacters = useCallback((toggledOn: boolean) => {
    setLocalSettings(prevSettings => {
      return {
        ...prevSettings,
        passwordComplexitySpecialCharacters: toggledOn,
      }
    })
  }, [])

  const onComplexityBlur = useCallback((value: number) => {
    setLocalSettings(prevSettings => {
      return {
        ...prevSettings,
        passwordComplexityMinimumLength: value,
      }
    })
  }, [])

  const onToggleComplexity = useCallback(
    (toggledOn: boolean) => {
      if (toggledOn) {
        setLocalSettings(() => {
          return {
            passwordComplexityEnabled: toggledOn,
            ...DEFAULT_PASSWORD_COMPLEXITY_SETTINGS,
          }
        })
      } else {
        setLocalSettings(() => {
          return {
            passwordComplexityEnabled: toggledOn,
            passwordComplexitySpecialCharacters: null,
            passwordComplexityMinimumLength: null,
          }
        })
        patchAuthSettings({
          data: {
            passwordComplexitySpecialCharacters: null,
            passwordComplexityMinimumLength: null,
          },
        }).catch(error => {
          console.error(error)
          setLocalSettings(fieldValuesPasswordSettings)
        })
      }
    },
    [fieldValuesPasswordSettings, patchAuthSettings]
  )

  const onSave = useCallback(() => {
    setShowConfirmationModal(false)
    if (
      typeof fieldValuesToUse.passwordComplexityMinimumLength === 'boolean' ||
      typeof fieldValuesToUse.passwordComplexitySpecialCharacters === 'number'
    ) {
      return
    }
    if (
      fieldValuesToUse.passwordComplexityMinimumLength ===
        fieldValues.passwordComplexityMinimumLength &&
      fieldValuesToUse.passwordComplexitySpecialCharacters ===
        fieldValues.passwordComplexitySpecialCharacters
    ) {
      return
    }

    patchAuthSettings({
      data: {
        passwordComplexityMinimumLength:
          fieldValuesToUse.passwordComplexityMinimumLength,
        passwordComplexitySpecialCharacters:
          fieldValuesToUse.passwordComplexitySpecialCharacters,
      },
    }).catch(error => {
      console.error(error)
      setLocalSettings(fieldValuesPasswordSettings)
    })
  }, [
    fieldValuesToUse,
    fieldValues.passwordComplexityMinimumLength,
    fieldValues.passwordComplexitySpecialCharacters,
    fieldValuesPasswordSettings,
    patchAuthSettings,
  ])

  const onCancel = useCallback(() => {
    setLocalSettings(fieldValuesPasswordSettings)
    setShowConfirmationModal(false)
  }, [fieldValuesPasswordSettings])

  const onConfirm = useCallback(() => {
    if (
      hasPasswordComplexityIncreased(
        getPasswordComplexitySettings(fieldValuesPasswordSettings),
        getPasswordComplexitySettings(localSettings)
      )
    ) {
      setShowConfirmationModal(true)
    } else {
      onSave()
    }
  }, [onSave, fieldValuesPasswordSettings, localSettings])

  return (
    <>
      <ComplianceReadyToggleField
        key={`passwordComplexityEnabled-${fieldValuesToUse.passwordComplexityEnabled}`}
        id="passwordComplexityEnabled"
        labelKey="desktop_require_password_complexity_requirements"
        values={fieldValuesToUse}
        onToggleChange={onToggleComplexity}
      >
        <ComplianceReadyToggleField
          id="passwordComplexitySpecialCharacters"
          labelKey="desktop_require_special_characters"
          values={fieldValuesToUse}
          onToggleChange={onToggleSpecialCharacters}
        />
        <InputSetting
          key="passwordComplexityMinimumLength"
          label={t('desktop_minimum_password_length')}
          value={
            !!fieldValuesToUse.passwordComplexityMinimumLength
              ? String(fieldValuesToUse.passwordComplexityMinimumLength)
              : ''
          }
          units={t('desktop_characters')}
          min={MIN_PASSWORD_COMPLEXITY_MINIMUM_LENGTH}
          max={MAX_PASSWORD_COMPLEXITY_MINIMUM_LENGTH}
          onBlur={onComplexityBlur}
        />
        {isEditing && (
          <>
            <Divider />
            <div className={styles.confirm_button_row}>
              <TextOnlyButton onClick={onCancel} buttonText={t('cancel')} />
              <PrimaryButton
                onClick={onConfirm}
                borderRadius={BORDERS.borderRadiusFull}
              >
                {t('save')}
              </PrimaryButton>
            </div>
          </>
        )}
      </ComplianceReadyToggleField>
      {showConfirmationModal && (
        <SettingsConfirmationModal
          title={t('desktop_require_password_complexity_modal_title') as string}
          heading={
            t('desktop_require_password_complexity_modal_heading') as string
          }
          description={
            t('desktop_require_password_complexity_modal_description') as string
          }
          confirmLabel={t('shared:confirm') as string}
          onConfirm={onSave}
          onCancel={onCancel}
        />
      )}
    </>
  )
}

function settingsAreEqual(
  oldSettings: LocalPasswordSettings,
  newSettings: LocalPasswordSettings
): boolean {
  return (
    oldSettings.passwordComplexityEnabled ===
      newSettings.passwordComplexityEnabled &&
    oldSettings.passwordComplexityMinimumLength ===
      newSettings.passwordComplexityMinimumLength &&
    oldSettings.passwordComplexitySpecialCharacters ===
      newSettings.passwordComplexitySpecialCharacters
  )
}

function getPasswordComplexitySettings(
  settings: FieldValues | LocalPasswordSettings
): PasswordComplexitySettings {
  return {
    passwordComplexitySpecialCharacters:
      settings.passwordComplexitySpecialCharacters as boolean | null,
    passwordComplexityMinimumLength:
      settings.passwordComplexityMinimumLength as number | null,
  }
}
