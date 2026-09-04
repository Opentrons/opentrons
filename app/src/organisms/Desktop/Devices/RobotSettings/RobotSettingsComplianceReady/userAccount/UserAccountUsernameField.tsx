import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { InputField, StyledText } from '@opentrons/components'

import { getUsernameValidationError } from '/app/resources/auth/getUsernameValidationError'

import styles from './userAccountForm.module.css'

import type { JSX } from 'react'
import type { Control, FieldValues, Path } from 'react-hook-form'

export interface UserAccountUsernameFieldProps<T extends FieldValues> {
  control: Control<T>
  autoFocus?: boolean
  usernameMaxLength?: number
  readOnly?: boolean
}

export function UserAccountUsernameField<T extends FieldValues>({
  control,
  autoFocus,
  usernameMaxLength,
  readOnly = false,
}: UserAccountUsernameFieldProps<T>): JSX.Element {
  const { t } = useTranslation('device_settings')
  const requiredError = t(
    'desktop_personal_account_settings_username_required_error'
  ) as string
  const tooLongError =
    usernameMaxLength != null
      ? (t('desktop_username_characters_max', {
          maxLength: usernameMaxLength,
        }) as string)
      : null
  const invalidCharactersError = t(
    'desktop_username_invalid_characters'
  ) as string

  return (
    <div className={styles.field_group}>
      <StyledText desktopStyle="bodyDefaultRegular">
        {t('desktop_username')}
      </StyledText>
      <div className={styles.field_group_value}>
        <Controller
          control={control}
          name={'username' as Path<T>}
          rules={{
            validate: value => {
              const username = value as string
              const trimmedUsername = username.trim()
              if (trimmedUsername === '') {
                return requiredError
              }
              const validationError = getUsernameValidationError(
                trimmedUsername,
                usernameMaxLength
              )
              if (validationError === 'tooLong') {
                return tooLongError ?? false
              }
              if (validationError === 'invalidCharacters') {
                return invalidCharactersError
              }
              return true
            },
          }}
          render={({ field, fieldState }) => {
            const trimmedUsername = (field.value as string).trim()
            const liveValidationError =
              trimmedUsername === ''
                ? null
                : getUsernameValidationError(trimmedUsername, usernameMaxLength)
            let liveError: string | null = null
            if (liveValidationError === 'tooLong') {
              liveError = tooLongError
            } else if (liveValidationError === 'invalidCharacters') {
              liveError = invalidCharactersError
            }
            const error = fieldState.error?.message ?? liveError

            return (
              <InputField
                autoFocus={autoFocus}
                readOnly={readOnly}
                value={field.value}
                error={error}
                caption={
                  usernameMaxLength != null && error == null
                    ? tooLongError
                    : null
                }
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )
          }}
        />
      </div>
    </div>
  )
}
