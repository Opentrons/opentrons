import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { COLORS, InputField, StyledText } from '@opentrons/components'

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
}
