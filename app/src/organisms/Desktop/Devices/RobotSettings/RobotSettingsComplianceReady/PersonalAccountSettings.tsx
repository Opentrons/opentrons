import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import axios from 'axios'

import { BasicButton, Divider, StyledText } from '@opentrons/components'
import {
  isDocumentedMutationError,
  useUpdateSelfMutation,
} from '@opentrons/react-api-client'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import {
  updateLoggedInUserProfile,
  useLoggedInUserForRobot,
} from '/app/redux/robot-auth'

import styles from './personalaccountsettings.module.css'
import { PersonalAccountSettingsEditForm } from './PersonalAccountSettingsEditForm'

import type { JSX, ReactNode } from 'react'
import type { UpdateSelfRequest } from '@opentrons/api-client'

export interface PersonalAccountSettingsProps {
  robotName: string
}

interface FieldRowProps {
  label: string
  children: ReactNode
}

function FieldRow({ label, children }: FieldRowProps): JSX.Element {
  return (
    <div className={styles.field_row}>
      <div className={styles.field_label}>
        <StyledText desktopStyle="bodyDefaultRegular">{label}</StyledText>
      </div>
      <div className={styles.field_value}>{children}</div>
    </div>
  )
}

export function PersonalAccountSettings({
  robotName,
}: PersonalAccountSettingsProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared'])
  const dispatch = useDispatch()
  const documentationState = useDocumentationState(undefined, robotName)
  const loggedInUser = useLoggedInUserForRobot(robotName)
  const { updateSelf, isLoading: isSaving } =
    useUpdateSelfMutation(documentationState)

  const [isEditing, setIsEditing] = useState(false)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const clearSaveErrors = (): void => {
    setUsernameError(null)
    setSaveError(null)
  }

  const handleSave = (request: UpdateSelfRequest): void => {
    void updateSelf(request)
      .then(updatedSelf => {
        dispatch(
          updateLoggedInUserProfile({
            robotName,
            username: updatedSelf.data.username,
            fullName: updatedSelf.data.fullName,
          })
        )
        clearSaveErrors()
        setIsEditing(false)
      })
      .catch((error: unknown) => {
        // User cancelled the documentation/login modal — stay on the edit form.
        if (isDocumentedMutationError(error)) {
          return
        }

        const errorId = axios.isAxiosError(error)
          ? error.response?.data?.errors?.[0]?.id
          : null

        if (errorId === 'userAlreadyExists') {
          setUsernameError(
            t(
              'desktop_personal_account_settings_username_exists_error'
            ) as string
          )
          setSaveError(null)
        } else {
          setUsernameError(null)
          setSaveError(
            t('desktop_personal_account_settings_save_error') as string
          )
        }
      })
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <StyledText desktopStyle="bodyLargeSemiBold">
          {t('desktop_personal_account_settings')}
        </StyledText>
        {loggedInUser != null &&
          (isEditing ? (
            <BasicButton
              type="button"
              underLine
              onClick={() => {
                clearSaveErrors()
                setIsEditing(false)
              }}
            >
              {t('shared:cancel')}
            </BasicButton>
          ) : (
            <BasicButton
              type="button"
              underLine
              onClick={() => {
                clearSaveErrors()
                setIsEditing(true)
              }}
            >
              {t('desktop_edit')}
            </BasicButton>
          ))}
      </div>
      <div className={styles.content}>
        {isEditing && loggedInUser != null ? (
          <PersonalAccountSettingsEditForm
            username={loggedInUser.username}
            fullName={loggedInUser.fullName}
            isSaving={isSaving}
            usernameError={usernameError}
            saveError={saveError}
            onSave={handleSave}
            onCancel={() => {
              clearSaveErrors()
              setIsEditing(false)
            }}
          />
        ) : (
          <>
            <FieldRow label={t('desktop_username')}>
              <StyledText
                desktopStyle="bodyDefaultRegular"
                className={styles.field_value_text}
              >
                {loggedInUser?.username}
              </StyledText>
            </FieldRow>
            <Divider />
            <FieldRow label={t('desktop_legal_name')}>
              <StyledText
                desktopStyle="bodyDefaultRegular"
                className={styles.field_value_text}
              >
                {loggedInUser?.fullName}
              </StyledText>
            </FieldRow>
            <Divider />
            <FieldRow label={t('desktop_password')}>
              <StyledText
                desktopStyle="bodyDefaultRegular"
                className={styles.field_value_text}
              >
                {t('desktop_password_placeholder')}
              </StyledText>
            </FieldRow>
          </>
        )}
      </div>
    </div>
  )
}
