import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { PrimaryButton, SecondaryButton } from '@opentrons/components'

import { mapAuthUserMutationError } from '/app/resources/auth/mapAuthUserMutationError'

import styles from '../userAccount/userAccountForm.module.css'
import { UserAccountIdentityFormFields } from '../userAccount/UserAccountIdentityFormFields'
import { UserAccountPasswordFormFields } from '../userAccount/UserAccountPasswordFormFields'

import type { TFunction } from 'i18next'
import type { JSX } from 'react'
import type { UpdateSelfRequest } from '@opentrons/api-client'

export interface PersonalAccountSettingsEditFormProps {
  username: string
  fullName: string
  isSaving: boolean
  onSave: (data: UpdateSelfRequest) => Promise<void>
  onCancel: () => void
}

interface FormValues {
  username: string
  fullName: string
  password: string
  confirmPassword: string
}

export function PersonalAccountSettingsEditForm({
  username,
  fullName,
  isSaving,
  onSave,
  onCancel,
}: PersonalAccountSettingsEditFormProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared']) as {
    t: TFunction
  }

  const { control, handleSubmit, watch, setError } = useForm<FormValues>({
    defaultValues: {
      username,
      fullName,
      password: '',
      confirmPassword: '',
    },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  })

  const {
    username: usernameInput,
    fullName: fullNameInput,
    password,
    confirmPassword,
  } = watch()
  const trimmedUsername = usernameInput.trim()
  const trimmedFullName = fullNameInput.trim()
  const hasProfileChanges =
    trimmedUsername !== username || trimmedFullName !== fullName
  const hasPasswordChange = password !== ''

  const isSaveDisabled =
    isSaving ||
    (!hasProfileChanges && !hasPasswordChange) ||
    (hasPasswordChange && (password === '' || confirmPassword === ''))

  const onSubmit = (): void => {
    void onSave({
      data: {
        ...(trimmedUsername !== username ? { username: trimmedUsername } : {}),
        ...(trimmedFullName !== fullName ? { fullName: trimmedFullName } : {}),
        ...(hasPasswordChange ? { password } : {}),
      },
    }).catch(error => {
      const formError = mapAuthUserMutationError<FormValues>(error, t)
      if (formError != null) {
        setError(formError.field, formError.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className={styles.form_fields}>
        <UserAccountIdentityFormFields control={control} />
        <UserAccountPasswordFormFields control={control} />
        <div className={styles.actions}>
          <SecondaryButton type="button" onClick={onCancel}>
            {t('shared:cancel') as string}
          </SecondaryButton>
          <PrimaryButton type="submit" disabled={isSaveDisabled}>
            {t('shared:save') as string}
          </PrimaryButton>
        </div>
      </div>
    </form>
  )
}
