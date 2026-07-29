import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  DropdownMenu,
  ModalShell,
  PrimaryButton,
  SecondaryButton,
  StyledText,
  WizardHeader,
} from '@opentrons/components'
import { useCreateUserMutation } from '@opentrons/react-api-client'

import { getTopPortalEl } from '/app/App/portal'
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
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(
    null
  )
  const documentationState = useDocumentationState(undefined, robotName)
  const { createUser, isLoading: isSaving } =
    useCreateUserMutation(documentationState)
  const { fieldErrors, clearFieldErrors, handleMutationError } =
    useAuthUserMutationErrors(t)

  const { control, handleSubmit, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      username: '',
      fullName: '',
      accountType: 'admin',
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
    setGeneratedPassword(null)
    onClose()
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
          clearFieldErrors()
        } else {
          handleClose()
        }
      })
      .catch(handleMutationError)
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
      {generatedPassword != null ? (
        <div className={styles.modal_content}>
          <div className={styles.form_fields}>
            <div className={styles.success_intro}>
              <StyledText desktopStyle="headingSmallBold">
                {t('desktop_one_time_password')}
              </StyledText>
              <StyledText desktopStyle="bodyDefaultRegular">
                {t('desktop_add_user_success_message')}
              </StyledText>
            </div>
            <div className={styles.field_group}>
              <StyledText desktopStyle="bodyDefaultRegular">
                {t('desktop_one_time_password')}
              </StyledText>
              <div className={styles.one_time_password_value}>
                <StyledText desktopStyle="bodyDefaultRegular">
                  {generatedPassword}
                </StyledText>
              </div>
            </div>
            <div className={styles.actions}>
              <PrimaryButton type="button" onClick={handleClose}>
                {t('done')}
              </PrimaryButton>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.modal_content}>
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
                  {t('shared:back')}
                </SecondaryButton>
                <PrimaryButton type="submit" disabled={isSaveDisabled}>
                  {t('shared:next')}
                </PrimaryButton>
              </div>
            </div>
          </form>
        </div>
      )}
    </ModalShell>,
    getTopPortalEl()
  )
}
