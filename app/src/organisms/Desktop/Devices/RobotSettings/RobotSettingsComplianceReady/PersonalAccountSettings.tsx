import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from 'react-query'

import { BasicButton, Divider, StyledText } from '@opentrons/components'
import {
  getSelfQueryKey,
  useHost,
  useSelfQuery,
  useUpdateSelfMutation,
} from '@opentrons/react-api-client'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { useUsernameForRobot } from '/app/redux/robot-auth'

import styles from './personalaccountsettings.module.css'
import { PersonalAccountSettingsEditForm } from './PersonalAccountSettingsEditForm'
import { useAuthUserMutationErrors } from './userAccount/useAuthUserMutationErrors'

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
  const queryClient = useQueryClient()
  const host = useHost()
  const documentationState = useDocumentationState(undefined, robotName)
  const loggedInUsername = useUsernameForRobot(robotName)
  const selfQuery = useSelfQuery({ enabled: loggedInUsername != null })
  const { updateSelf, isLoading: isSaving } =
    useUpdateSelfMutation(documentationState)
  const username = selfQuery.data?.data.username ?? loggedInUsername ?? ''
  const fullName = selfQuery.data?.data.fullName ?? ''

  const [isEditing, setIsEditing] = useState(false)
  const { fieldErrors, clearFieldErrors, handleMutationError } =
    useAuthUserMutationErrors(t)

  const handleSave = (request: UpdateSelfRequest): void => {
    void updateSelf(request)
      .then(updatedSelf => {
        queryClient.setQueryData(getSelfQueryKey(host), updatedSelf)
        clearFieldErrors()
        setIsEditing(false)
      })
      .catch(handleMutationError)
  }

  const handleCancelEdit = (): void => {
    clearFieldErrors()
    setIsEditing(false)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <StyledText desktopStyle="bodyLargeSemiBold">
          {t('desktop_personal_account_settings')}
        </StyledText>
        {loggedInUsername != null &&
          (isEditing ? (
            <BasicButton type="button" underLine onClick={handleCancelEdit}>
              {t('shared:cancel')}
            </BasicButton>
          ) : (
            <BasicButton
              type="button"
              underLine
              onClick={() => {
                clearFieldErrors()
                setIsEditing(true)
              }}
            >
              {t('desktop_edit')}
            </BasicButton>
          ))}
      </div>
      <div className={styles.content}>
        {isEditing ? (
          <PersonalAccountSettingsEditForm
            username={username}
            fullName={fullName}
            isSaving={isSaving}
            fieldErrors={fieldErrors}
            onSave={handleSave}
            onCancel={handleCancelEdit}
          />
        ) : (
          <>
            <FieldRow label={t('desktop_username')}>
              <StyledText
                desktopStyle="bodyDefaultRegular"
                className={styles.field_value_text}
              >
                {username}
              </StyledText>
            </FieldRow>
            <Divider />
            <FieldRow label={t('desktop_legal_name')}>
              <StyledText
                desktopStyle="bodyDefaultRegular"
                className={styles.field_value_text}
              >
                {fullName}
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
