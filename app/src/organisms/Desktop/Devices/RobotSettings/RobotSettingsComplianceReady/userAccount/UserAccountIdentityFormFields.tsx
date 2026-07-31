import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { COLORS, InputField, StyledText } from '@opentrons/components'

import styles from './userAccountForm.module.css'

import type { JSX } from 'react'
import type { Control, FieldValues, Path } from 'react-hook-form'

export interface UserAccountIdentityFormFieldsProps<T extends FieldValues> {
  control: Control<T>
  stacked?: boolean
  usernameMaxLength?: number
}

export function UserAccountIdentityFormFields<T extends FieldValues>({
  control,
  stacked = false,
  usernameMaxLength,
}: UserAccountIdentityFormFieldsProps<T>): JSX.Element {
  const { t } = useTranslation('device_settings')

  const usernameField = (
    <div className={styles.field_group}>
      <StyledText desktopStyle="bodyDefaultRegular">
        {t('desktop_username')}
      </StyledText>
      <div className={styles.field_group_value}>
        <Controller
          control={control}
          name={'username' as Path<T>}
          rules={{
            validate: value =>
              (value as string).trim() !== '' ||
              (t(
                'desktop_personal_account_settings_username_required_error'
              ) as string),
          }}
          render={({ field, fieldState }) => {
            const isUsernameTooLong =
              usernameMaxLength != null &&
              (field.value as string).length > usernameMaxLength

            return (
              <>
                <InputField
                  value={field.value}
                  error={fieldState.error?.message}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
                {usernameMaxLength != null ? (
                  <StyledText
                    desktopStyle="bodyDefaultRegular"
                    color={isUsernameTooLong ? COLORS.red50 : COLORS.grey60}
                  >
                    {t('desktop_username_characters_max', {
                      maxLength: usernameMaxLength,
                    })}
                  </StyledText>
                ) : null}
              </>
            )
          }}
        />
      </div>
    </div>
  )

  const fullNameField = (
    <div className={styles.field_group}>
      <StyledText desktopStyle="bodyDefaultRegular">
        {t('desktop_legal_name')}
      </StyledText>
      <div className={styles.field_group_value}>
        <Controller
          control={control}
          name={'fullName' as Path<T>}
          rules={{
            validate: value =>
              (value as string).trim() !== '' ||
              (t('desktop_add_user_legal_name_required_error') as string),
          }}
          render={({ field, fieldState }) => (
            <InputField
              value={field.value}
              error={fieldState.error?.message}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />
      </div>
    </div>
  )

  if (stacked) {
    return (
      <>
        {usernameField}
        {fullNameField}
      </>
    )
  }

  return (
    <div className={styles.fields_row}>
      {usernameField}
      {fullNameField}
    </div>
  )
}
