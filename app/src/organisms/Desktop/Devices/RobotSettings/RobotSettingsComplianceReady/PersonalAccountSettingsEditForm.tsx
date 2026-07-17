import { Controller, useForm } from 'react-hook-form'
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
import type { FieldError, Resolver } from 'react-hook-form'
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

interface FormValues {
  username: string
  fullName: string
  password: string
  confirmPassword: string
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
      <div className={styles.fields_row}>
        <FieldGroup label={t('desktop_username')}>
          <Controller
            control={control}
            name="username"
            render={({ field, fieldState }) => (
              <InputField
                value={field.value}
                error={fieldState.error?.message ?? usernameError}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
        </FieldGroup>
        <FieldGroup label={t('desktop_legal_name')}>
          <Controller
            control={control}
            name="fullName"
            render={({ field }) => (
              <InputField
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
        </FieldGroup>
      </div>
      <div className={styles.fields_row}>
        <FieldGroup label={t('desktop_password')}>
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <PasswordInputField
                value={field.value}
                placeholder={t('desktop_password_placeholder')}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
        </FieldGroup>
        <FieldGroup label={t('desktop_confirm_password')}>
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field, fieldState }) => (
              <PasswordInputField
                value={field.value}
                placeholder={t('desktop_password_placeholder')}
                error={fieldState.error?.message ?? saveError}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
        </FieldGroup>
      </div>
      <div className={styles.actions}>
        <SecondaryButton type="button" onClick={onCancel}>
          {t('shared:cancel')}
        </SecondaryButton>
        <PrimaryButton type="submit" disabled={isSaveDisabled}>
          {t('shared:save')}
        </PrimaryButton>
      </div>
    </form>
  )
}
