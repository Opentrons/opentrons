import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { PrimaryButton, SecondaryButton } from '@opentrons/components'

import styles from './userAccount/userAccountForm.module.css'
import { UserAccountIdentityFormFields } from './userAccount/UserAccountIdentityFormFields'
import { UserAccountPasswordFormFields } from './userAccount/UserAccountPasswordFormFields'

import type { JSX } from 'react'
import type { FieldError, Resolver } from 'react-hook-form'
import type { UpdateSelfRequest } from '@opentrons/api-client'
import type { AuthUserFieldErrors } from './userAccount/useAuthUserMutationErrors'

export interface PersonalAccountSettingsEditFormProps {
  username: string
  fullName: string
  isSaving: boolean
  fieldErrors?: Partial<AuthUserFieldErrors>
  onSave: (data: UpdateSelfRequest) => void
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
  fieldErrors = {},
  onSave,
  onCancel,
}: PersonalAccountSettingsEditFormProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared'])

  const resolver: Resolver<FormValues> = values => {
    const errors: Partial<Record<keyof FormValues, FieldError>> = {}

    if (values.username.trim() === '') {
      errors.username = {
        type: 'required',
        message: t(
          'desktop_personal_account_settings_username_required_error'
        ) as string,
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

  const { control, handleSubmit, watch } = useForm<FormValues>({
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
    onSave({
      data: {
        ...(trimmedUsername !== username ? { username: trimmedUsername } : {}),
        ...(trimmedFullName !== fullName ? { fullName: trimmedFullName } : {}),
        ...(hasPasswordChange ? { password } : {}),
      },
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className={styles.form_fields}>
        <UserAccountIdentityFormFields
          control={control}
          fieldErrors={{ usernameError: fieldErrors.usernameError }}
        />
        <UserAccountPasswordFormFields
          control={control}
          fieldErrors={{
            confirmPasswordError: fieldErrors.confirmPasswordError ?? null,
          }}
        />
        <div className={styles.actions}>
          <SecondaryButton type="button" onClick={onCancel}>
            {t('shared:cancel')}
          </SecondaryButton>
          <PrimaryButton type="submit" disabled={isSaveDisabled}>
            {t('shared:save')}
          </PrimaryButton>
        </div>
      </div>
    </form>
  )
}
