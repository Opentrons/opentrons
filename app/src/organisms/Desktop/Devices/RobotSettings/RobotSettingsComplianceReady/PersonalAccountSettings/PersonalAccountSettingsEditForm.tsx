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
  identityReadOnly?: boolean
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
  identityReadOnly = false,
  onSave,
  onCancel,
}: PersonalAccountSettingsEditFormProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared']) as {
    t: TFunction
  }

  const { control, handleSubmit, setError } = useForm<FormValues>({
    defaultValues: {
      username,
      fullName,
      password: '',
      confirmPassword: '',
    },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  })

  const onSubmit = (data: FormValues): void => {
    const trimmedUsername = data.username.trim()
    const trimmedFullName = data.fullName.trim()
    const hasProfileChanges =
      !identityReadOnly &&
      (trimmedUsername !== username || trimmedFullName !== fullName)
    const hasPasswordChange = data.password !== ''

    if (!hasProfileChanges && !hasPasswordChange) {
      return
    }

    void onSave({
      data: {
        ...(!identityReadOnly && trimmedUsername !== username
          ? { username: trimmedUsername }
          : {}),
        ...(!identityReadOnly && trimmedFullName !== fullName
          ? { fullName: trimmedFullName }
          : {}),
        ...(hasPasswordChange ? { password: data.password } : {}),
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
        <UserAccountIdentityFormFields
          control={control}
          readOnly={identityReadOnly}
        />
        <UserAccountPasswordFormFields control={control} />
        <div className={styles.actions}>
          <SecondaryButton type="button" onClick={onCancel}>
            {t('shared:cancel') as string}
          </SecondaryButton>
          <PrimaryButton type="submit" disabled={isSaving}>
            {t('shared:save') as string}
          </PrimaryButton>
        </div>
      </div>
    </form>
  )
}
