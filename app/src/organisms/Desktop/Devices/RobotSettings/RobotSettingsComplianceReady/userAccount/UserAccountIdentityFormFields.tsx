import styles from './userAccountForm.module.css'
import { UserAccountFullNameField } from './UserAccountFullNameField'
import { UserAccountUsernameField } from './UserAccountUsernameField'

import type { JSX } from 'react'
import type { Control, FieldValues } from 'react-hook-form'

export interface UserAccountIdentityFormFieldsProps<T extends FieldValues> {
  control: Control<T>
  autoFocusFirstField?: boolean
  stacked?: boolean
  usernameMaxLength?: number
  readOnly?: boolean
}

export function UserAccountIdentityFormFields<T extends FieldValues>({
  control,
  autoFocusFirstField,
  stacked = false,
  usernameMaxLength,
  readOnly = false,
}: UserAccountIdentityFormFieldsProps<T>): JSX.Element {
  if (stacked) {
    return (
      <>
        <UserAccountUsernameField
          autoFocus={autoFocusFirstField}
          control={control}
          usernameMaxLength={usernameMaxLength}
          readOnly={readOnly}
        />
        <UserAccountFullNameField control={control} readOnly={readOnly} />
      </>
    )
  }

  return (
    <div className={styles.fields_row}>
      <UserAccountUsernameField
        autoFocus={autoFocusFirstField}
        control={control}
        usernameMaxLength={usernameMaxLength}
        readOnly={readOnly}
      />
      <UserAccountFullNameField control={control} readOnly={readOnly} />
    </div>
  )
}
