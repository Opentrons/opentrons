import styles from './userAccountForm.module.css'
import { UserAccountFullNameField } from './UserAccountFullNameField'
import { UserAccountUsernameField } from './UserAccountUsernameField'

import type { JSX } from 'react'
import type { Control, FieldValues } from 'react-hook-form'

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
  if (stacked) {
    return (
      <>
        <UserAccountUsernameField
          control={control}
          usernameMaxLength={usernameMaxLength}
        />
        <UserAccountFullNameField control={control} />
      </>
    )
  }

  return (
    <div className={styles.fields_row}>
      <UserAccountUsernameField
        control={control}
        usernameMaxLength={usernameMaxLength}
      />
      <UserAccountFullNameField control={control} />
    </div>
  )
}
