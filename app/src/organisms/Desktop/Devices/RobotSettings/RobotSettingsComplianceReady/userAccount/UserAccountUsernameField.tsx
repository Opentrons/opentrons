import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { InputField, StyledText } from '@opentrons/components'

import styles from './userAccountForm.module.css'

import type { JSX } from 'react'
import type { Control, FieldValues, Path } from 'react-hook-form'

export interface UserAccountUsernameFieldProps<T extends FieldValues> {
  control: Control<T>
  usernameMaxLength?: number
}

export function UserAccountUsernameField<T extends FieldValues>({
  control,
  usernameMaxLength,
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
              if (username.trim() === '') {
                return requiredError
              }
              if (
                usernameMaxLength != null &&
                username.length > usernameMaxLength
              ) {
                return tooLongError ?? false
              }
              return true
            },
          }}
          render={({ field, fieldState }) => {
            const isUsernameTooLong =
              usernameMaxLength != null &&
              (field.value as string).length > usernameMaxLength
            const error =
              fieldState.error?.message ??
              (isUsernameTooLong ? tooLongError : null)

            return (
              <InputField
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
