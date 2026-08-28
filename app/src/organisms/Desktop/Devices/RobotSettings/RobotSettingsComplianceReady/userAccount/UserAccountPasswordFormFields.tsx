import { Controller, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { StyledText } from '@opentrons/components'

import { PasswordInputField } from '../PasswordInputField'
import styles from './userAccountForm.module.css'

import type { JSX } from 'react'
import type { Control, FieldValues, Path } from 'react-hook-form'

export interface UserAccountPasswordFormFieldsProps<T extends FieldValues> {
  control: Control<T>
}

export function UserAccountPasswordFormFields<T extends FieldValues>({
  control,
}: UserAccountPasswordFormFieldsProps<T>): JSX.Element {
  const { t } = useTranslation('device_settings')
  const password = useWatch({
    control,
    name: 'password' as Path<T>,
  })

  return (
    <div className={styles.fields_row}>
      <div className={styles.field_group}>
        <StyledText desktopStyle="bodyDefaultRegular">
          {t('desktop_new_password')}
        </StyledText>
        <div className={styles.field_group_value}>
          <Controller
            control={control}
            name={'password' as Path<T>}
            render={({ field, fieldState }) => (
              <PasswordInputField
                value={field.value}
                error={fieldState.error?.message}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
        </div>
      </div>
      <div className={styles.field_group}>
        <StyledText desktopStyle="bodyDefaultRegular">
          {t('desktop_confirm_new_password')}
        </StyledText>
        <div className={styles.field_group_value}>
          <Controller
            control={control}
            name={'confirmPassword' as Path<T>}
            rules={{
              validate: value =>
                (password as string) === '' ||
                (value as string) === '' ||
                (value as string) === (password as string) ||
                (t('desktop_password_mismatch') as string),
            }}
            render={({ field, fieldState }) => (
              <PasswordInputField
                value={field.value}
                error={fieldState.error?.message}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
        </div>
      </div>
    </div>
  )
}
