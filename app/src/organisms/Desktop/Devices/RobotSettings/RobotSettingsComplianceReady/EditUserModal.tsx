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
import { useUpdateUserMutation } from '@opentrons/react-api-client'

import { getTopPortalEl } from '/app/App/portal'
import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'

import { mapAuthUserMutationError } from './userAccount/mapAuthUserMutationError'
import {
  MANAGEABLE_USER_ACCOUNT_TYPES,
  USERNAME_MAX_LENGTH,
} from './userAccount/constants'
import styles from './userAccount/userAccountForm.module.css'
import { UserAccountIdentityFormFields } from './userAccount/UserAccountIdentityFormFields'

import type { TFunction } from 'i18next'
import type { JSX } from 'react'
import type { AuthUser, AuthUserAccountType } from '@opentrons/api-client'
import type { DropdownOption } from '@opentrons/components'

interface FormValues {
  username: string
  fullName: string
  accountType: AuthUserAccountType
}

export interface EditUserModalProps {
  robotName: string
  user: AuthUser
  onClose: () => void
  onUserUpdated?: () => void
}

export function EditUserModal({
  robotName,
  user,
  onClose,
  onUserUpdated,
}: EditUserModalProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared']) as {
    t: TFunction
  }
  const documentationState = useDocumentationState(undefined, robotName)
  const { updateUser, isLoading: isSaving } =
    useUpdateUserMutation(documentationState)
  const { control, handleSubmit, watch, setValue, setError, clearErrors } =
    useForm<FormValues>({
      defaultValues: {
        username: user.username,
        fullName: user.fullName,
        accountType: user.accountType,
      },
      mode: 'onBlur',
      reValidateMode: 'onChange',
    })

  const { username, fullName, accountType } = watch()
  const accountTypeOptions: DropdownOption[] =
    MANAGEABLE_USER_ACCOUNT_TYPES.map(type => ({
      name: t(`desktop_user_role_${type}`),
      value: type,
    }))
  const selectedAccountTypeOption =
    accountTypeOptions.find(option => option.value === accountType) ??
    accountTypeOptions[0]!

  const trimmedUsername = username.trim()
  const trimmedFullName = fullName.trim()
  const hasChanges =
    trimmedUsername !== user.username ||
    trimmedFullName !== user.fullName ||
    accountType !== user.accountType

  const isSaveDisabled =
    isSaving ||
    !hasChanges ||
    trimmedUsername === '' ||
    trimmedFullName === '' ||
    trimmedUsername.length > USERNAME_MAX_LENGTH

  const handleClose = (): void => {
    clearErrors()
    onClose()
  }

  const onSubmit = (): void => {
    void updateUser({
      username: user.username,
      request: {
        data: {
          ...(trimmedUsername !== user.username
            ? { username: trimmedUsername }
            : {}),
          ...(trimmedFullName !== user.fullName
            ? { fullName: trimmedFullName }
            : {}),
          ...(accountType !== user.accountType ? { accountType } : {}),
        },
      },
    })
      .then(() => {
        onUserUpdated?.()
        handleClose()
      })
      .catch(error => {
        const formError = mapAuthUserMutationError<FormValues>(error, t)
        if (formError != null) {
          setError(formError.field, formError.error)
        }
      })
  }

  return createPortal(
    <ModalShell
      width="31.25rem"
      header={
        <WizardHeader
          title={t('desktop_edit_user')}
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
                {t('shared:save') as string}
              </PrimaryButton>
            </div>
          </div>
        </form>
      </div>
    </ModalShell>,
    getTopPortalEl()
  )
}
