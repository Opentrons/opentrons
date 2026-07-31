import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { PrimaryButton, SecondaryButton } from '@opentrons/components'

import { applyAuthUserMutationError } from './userAccount/mapAuthUserMutationError'
import styles from './userAccount/userAccountForm.module.css'
import { UserAccountIdentityFormFields } from './userAccount/UserAccountIdentityFormFields'
import { UserAccountPasswordFormFields } from './userAccount/UserAccountPasswordFormFields'

import type { TFunction } from 'i18next'
import type { JSX } from 'react'
import type { FieldError, Resolver } from 'react-hook-form'
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
  const { t }: { t: TFunction } = useTranslation(['device_settings', 'shared'])

  const resolver: Resolver<FormValues> = values => {
    const errors: Partial<Record<keyof FormValues, FieldError>> = {}

    if (values.username.trim() === '') {
      errors.username = {
        type: 'validate',
        message: t(
          'desktop_personal_account_settings_username_required_error'
        ) as string,
      }
    }

    if (values.fullName.trim() === '') {
      errors.fullName = {
        type: 'validate',
        message: t('desktop_add_user_legal_name_required_error') as string,
      }
    }

    if (values.password !== '' && values.password !== values.confirmPassword) {
      errors.confirmPassword = {
        type: 'validate',
        message: t('desktop_password_mismatch') as string,
      }
    }

    return { values, errors }
  }

  const { control, handleSubmit, watch, setError } = useForm<FormValues>({
    defaultValues: {
      username,
      fullName,
      password: '',
      confirmPassword: '',
    },
    resolver,
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
      applyAuthUserMutationError(setError, error, t)
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
