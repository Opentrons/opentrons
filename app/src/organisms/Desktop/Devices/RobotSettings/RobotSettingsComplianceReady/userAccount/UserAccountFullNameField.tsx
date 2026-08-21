import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { InputField, StyledText } from '@opentrons/components'

import styles from './userAccountForm.module.css'

import type { JSX } from 'react'
import type { Control, FieldValues, Path } from 'react-hook-form'

export interface UserAccountFullNameFieldProps<T extends FieldValues> {
  control: Control<T>
}

export function UserAccountFullNameField<T extends FieldValues>({
  control,
}: UserAccountFullNameFieldProps<T>): JSX.Element {
  const { t } = useTranslation('device_settings')

  return (
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
}
