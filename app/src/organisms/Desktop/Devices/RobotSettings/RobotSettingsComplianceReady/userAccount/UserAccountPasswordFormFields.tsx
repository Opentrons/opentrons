import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { StyledText } from '@opentrons/components'

import { PasswordInputField } from '../PasswordInputField'
import styles from './userAccountForm.module.css'

import type { JSX } from 'react'
import type { Control, FieldValues, Path } from 'react-hook-form'
import type { AuthUserFieldErrors } from './useAuthUserMutationErrors'

export interface UserAccountPasswordFormFieldsProps<T extends FieldValues> {
  control: Control<T>
  fieldErrors?: Partial<
    Pick<AuthUserFieldErrors, 'passwordError' | 'confirmPasswordError'>
  >
}

export function UserAccountPasswordFormFields<T extends FieldValues>({
  control,
  fieldErrors = {},
}: UserAccountPasswordFormFieldsProps<T>): JSX.Element {
  const { t } = useTranslation('device_settings')
  const { passwordError = null, confirmPasswordError = null } = fieldErrors

  return (
    <div className={styles.fields_row}>
      <div className={styles.field_group}>
        <StyledText desktopStyle="bodyDefaultRegular">
          {t('desktop_password')}
        </StyledText>
        <div className={styles.field_group_value}>
          <Controller
            control={control}
            name={'password' as Path<T>}
            render={({ field, fieldState }) => (
              <PasswordInputField
                value={field.value}
                placeholder={t('desktop_password_placeholder')}
                error={fieldState.error?.message ?? passwordError}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
        </div>
      </div>
      <div className={styles.field_group}>
        <StyledText desktopStyle="bodyDefaultRegular">
          {t('desktop_confirm_password')}
        </StyledText>
        <div className={styles.field_group_value}>
          <Controller
            control={control}
            name={'confirmPassword' as Path<T>}
            render={({ field, fieldState }) => (
              <PasswordInputField
                value={field.value}
                placeholder={t('desktop_password_placeholder')}
                error={fieldState.error?.message ?? confirmPasswordError}
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
