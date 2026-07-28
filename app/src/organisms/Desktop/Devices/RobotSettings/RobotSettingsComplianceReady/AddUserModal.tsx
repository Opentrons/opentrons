import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  DropdownMenu,
  Modal,
  PrimaryButton,
  SecondaryButton,
  StyledText,
} from '@opentrons/components'
import { useCreateUserMutation } from '@opentrons/react-api-client'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'

import { useAuthUserMutationErrors } from './userAccount/useAuthUserMutationErrors'
import styles from './userAccount/userAccountForm.module.css'
import { UserAccountIdentityFormFields } from './userAccount/UserAccountIdentityFormFields'

import type { JSX } from 'react'
import type {
  AuthUserAccountType,
  CreateUserRequest,
} from '@opentrons/api-client'
import type { DropdownOption } from '@opentrons/components'

const ADD_USER_ACCOUNT_TYPES: AuthUserAccountType[] = [
  'admin',
  'user',
  'auditor',
]

function generatePlaceholderPassword(): string {
  // TODO: replace with a placeholder password from the server
  return '12345678'
}

interface FormValues {
  username: string
  fullName: string
  accountType: AuthUserAccountType
}

export interface AddUserModalProps {
  robotName: string
  onClose: () => void
}

export function AddUserModal({
  robotName,
  onClose,
}: AddUserModalProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared'])
  const documentationState = useDocumentationState(undefined, robotName)
  const { createUser, isLoading: isSaving } =
    useCreateUserMutation(documentationState)
  const { fieldErrors, clearFieldErrors, handleMutationError } =
    useAuthUserMutationErrors(t)

  const { control, handleSubmit, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      username: '',
      fullName: '',
      accountType: 'user',
    },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  })

  const { username, fullName, accountType } = watch()
  const accountTypeOptions: DropdownOption[] = ADD_USER_ACCOUNT_TYPES.map(
    accountType => ({
      name: t(`desktop_user_role_${accountType}`),
      value: accountType,
    })
  )
  const selectedAccountTypeOption =
    accountTypeOptions.find(option => option.value === accountType) ??
    accountTypeOptions[0]!

  const isSaveDisabled =
    isSaving || username.trim() === '' || fullName.trim() === ''

  const handleClose = (): void => {
    clearFieldErrors()
    onClose()
  }

  const onSubmit = (): void => {
    const trimmedUsername = username.trim()
    const request: CreateUserRequest = {
      data: {
        username: trimmedUsername,
        fullName: fullName.trim(),
        password: generatePlaceholderPassword(),
        accountType,
      },
    }

    void createUser(request)
      .then(() => {
        handleClose()
      })
      .catch(handleMutationError)
  }

  return (
    <Modal
      title={t('desktop_add_user')}
      onClose={handleClose}
      closeOnOutsideClick={false}
      width="47rem"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.form_fields}>
          <UserAccountIdentityFormFields
            control={control}
            fieldErrors={fieldErrors}
            stacked
          />
          <div className={styles.field_group}>
            <div className={styles.field_group_value}>
              <DropdownMenu
                filterOptions={accountTypeOptions}
                currentOption={selectedAccountTypeOption}
                onClick={value => {
                  setValue('accountType', value as AuthUserAccountType, {
                    shouldValidate: true,
                  })
                }}
                title={t('desktop_role')}
                width="100%"
              />
            </div>
          </div>
          <div className={styles.actions}>
            <SecondaryButton type="button" onClick={handleClose}>
              {t('shared:cancel')}
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={isSaveDisabled}>
              {t('shared:save')}
            </PrimaryButton>
          </div>
        </div>
      </form>
    </Modal>
  )
}
