import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  InputField,
  PrimaryButton,
  SecondaryButton,
  StyledText,
} from '@opentrons/components'

import { PasswordInputField } from './PasswordInputField'
import styles from './personalaccountsettings.module.css'

import type { JSX, ReactNode } from 'react'
import type { UpdateSelfRequest } from '@opentrons/api-client'

export interface PersonalAccountSettingsEditFormProps {
  username: string
  fullName: string
  isSaving: boolean
  usernameError?: string | null
  saveError?: string | null
  onSave: (data: UpdateSelfRequest) => void
  onCancel: () => void
}

interface FieldGroupProps {
  label: string
  children: ReactNode
}

function FieldGroup({ label, children }: FieldGroupProps): JSX.Element {
  return (
    <div className={styles.field_group}>
      <StyledText desktopStyle="bodyDefaultRegular">{label}</StyledText>
      <div className={styles.field_group_value}>{children}</div>
    </div>
  )
}

export function PersonalAccountSettingsEditForm({
  username,
  fullName,
  isSaving,
  usernameError = null,
  saveError = null,
  onSave,
  onCancel,
}: PersonalAccountSettingsEditFormProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared'])
  const [usernameInput, setUsernameInput] = useState(username)
  const [fullNameInput, setFullNameInput] = useState(fullName)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | null
  >(null)

  const hasProfileChanges =
    usernameInput.trim() !== username || fullNameInput.trim() !== fullName
  const hasPasswordChange = password !== ''

  const validatePasswords = (): boolean => {
    if (!hasPasswordChange) {
      setConfirmPasswordError(null)
      return true
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError(t('desktop_password_mismatch') as string)
      return false
    }
    setConfirmPasswordError(null)
    return true
  }

  const handleSave = (): void => {
    if (!validatePasswords()) {
      return
    }

    if (!hasProfileChanges && !hasPasswordChange) {
      onCancel()
      return
    }

    const trimmedUsername = usernameInput.trim()
    const trimmedFullName = fullNameInput.trim()
    const updateData: UpdateSelfRequest['data'] = {}

    if (trimmedUsername !== username) {
      updateData.username = trimmedUsername
    }
    if (trimmedFullName !== fullName) {
      updateData.fullName = trimmedFullName
    }
    if (hasPasswordChange) {
      updateData.password = password
    }

    onSave({ data: updateData })
  }

  const isSaveDisabled =
    isSaving ||
    (!hasProfileChanges && !hasPasswordChange) ||
    (hasPasswordChange && (password === '' || confirmPassword === ''))

  return (
    <>
      <div className={styles.fields_row}>
        <FieldGroup label={t('desktop_username')}>
          <InputField
            value={usernameInput}
            error={usernameError}
            onChange={event => {
              setUsernameInput(event.target.value)
            }}
          />
        </FieldGroup>
        <FieldGroup label={t('desktop_legal_name')}>
          <InputField
            value={fullNameInput}
            onChange={event => {
              setFullNameInput(event.target.value)
            }}
          />
        </FieldGroup>
      </div>
      <div className={styles.fields_row}>
        <FieldGroup label={t('desktop_password')}>
          <PasswordInputField
            value={password}
            placeholder={t('desktop_password_placeholder')}
            onChange={event => {
              setPassword(event.target.value)
              if (confirmPasswordError != null) {
                setConfirmPasswordError(null)
              }
            }}
            onBlur={validatePasswords}
          />
        </FieldGroup>
        <FieldGroup label={t('desktop_confirm_password')}>
          <PasswordInputField
            value={confirmPassword}
            placeholder={t('desktop_password_placeholder')}
            error={confirmPasswordError ?? saveError}
            onChange={event => {
              setConfirmPassword(event.target.value)
              if (confirmPasswordError != null) {
                setConfirmPasswordError(null)
              }
            }}
            onBlur={validatePasswords}
          />
        </FieldGroup>
      </div>
      <div className={styles.actions}>
        <SecondaryButton onClick={onCancel}>
          {t('shared:cancel')}
        </SecondaryButton>
        <PrimaryButton disabled={isSaveDisabled} onClick={handleSave}>
          {t('shared:save')}
        </PrimaryButton>
      </div>
    </>
  )
}
