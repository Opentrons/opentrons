import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  DropdownMenu,
  ModalShell,
  PrimaryButton,
  SecondaryButton,
  WizardHeader,
} from '@opentrons/components'
import { useCreateUserMutation } from '@opentrons/react-api-client'

import { getTopPortalEl } from '/app/App/portal'
import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'

import {
  MANAGEABLE_USER_ACCOUNT_TYPES,
  USERNAME_MAX_LENGTH,
} from './userAccount/constants'
import { mapAuthUserMutationError } from './userAccount/mapAuthUserMutationError'
import { OneTimePasswordModal } from './userAccount/OneTimePasswordModal'
import styles from './userAccount/userAccountForm.module.css'
import { UserAccountIdentityFormFields } from './userAccount/UserAccountIdentityFormFields'

import type { TFunction } from 'i18next'
import type { JSX } from 'react'
import type {
  AuthUserAccountType,
  CreateUserRequest,
} from '@opentrons/api-client'
import type { DropdownOption } from '@opentrons/components'

interface FormValues {
  username: string
  fullName: string
  accountType: AuthUserAccountType
}

export interface AddUserModalProps {
  robotName: string
  onClose: () => void
  onUserCreated?: () => void
}

export function AddUserModal({
  robotName,
  onClose,
  onUserCreated,
}: AddUserModalProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared']) as {
    t: TFunction
  }
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(
    null
  )
  const documentationState = useDocumentationState(undefined, robotName)
  const { createUser, isLoading: isSaving } =
    useCreateUserMutation(documentationState)
  const { control, handleSubmit, watch, setValue, setError, clearErrors } =
    useForm<FormValues>({
      defaultValues: {
        username: '',
        fullName: '',
        accountType: 'admin',
      },
      mode: 'onBlur',
      reValidateMode: 'onChange',
    })

  const { username, fullName, accountType } = watch()
  const accountTypeOptions: DropdownOption[] =
    MANAGEABLE_USER_ACCOUNT_TYPES.map(accountType => ({
      name: t(`desktop_user_role_${accountType}`),
      value: accountType,
    }))
  const selectedAccountTypeOption =
    accountTypeOptions.find(option => option.value === accountType) ??
    accountTypeOptions[0]!

  const isSaveDisabled =
    isSaving ||
    username.trim() === '' ||
    fullName.trim() === '' ||
    username.length > USERNAME_MAX_LENGTH

  const handleClose = (): void => {
    clearErrors()
    setGeneratedPassword(null)
    onClose()
  }

  const handleConfirm = (): void => {
    onUserCreated?.()
    handleClose()
  }

  const onSubmit = (): void => {
    const trimmedUsername = username.trim()
    const request: CreateUserRequest = {
      data: {
        username: trimmedUsername,
        fullName: fullName.trim(),
        accountType,
      },
    }

    void createUser(request)
      .then(response => {
        const { temporaryPassword } = response.data
        if (temporaryPassword != null) {
          setGeneratedPassword(temporaryPassword)
          clearErrors()
        } else {
          handleClose()
        }
      })
      .catch(error => {
        const formError = mapAuthUserMutationError<FormValues>(error, t)
        if (formError != null) {
          setError(formError.field, formError.error)
        }
      })
  }

  if (generatedPassword != null) {
    return (
      <OneTimePasswordModal
        password={generatedPassword}
        message={t('desktop_add_user_success_message') as string}
        onConfirm={handleConfirm}
        onClose={handleClose}
      />
    )
  }

  return createPortal(
    <ModalShell
      width="31.25rem"
      header={
        <WizardHeader
          title={t('desktop_add_user')}
          onExit={handleClose}
          hideStepText
          exitButtonCopy={t('shared:exit')}
        />
      }
    >
      <div className={styles.modal_content}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.form_fields}>
            <UserAccountIdentityFormFields
              control={control}
              stacked
              usernameMaxLength={USERNAME_MAX_LENGTH}
            />
            <div className={styles.field_group}>
              <div className={styles.field_group_value}>
                <DropdownMenu
                  filterOptions={accountTypeOptions}
                  currentOption={selectedAccountTypeOption}
                  dropdownType="neutral"
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
                {t('shared:cancel') as string}
              </SecondaryButton>
              <PrimaryButton type="submit" disabled={isSaveDisabled}>
                {t('desktop_create_account')}
              </PrimaryButton>
            </div>
          </div>
        </form>
      </div>
    </ModalShell>,
    getTopPortalEl()
  )
}
