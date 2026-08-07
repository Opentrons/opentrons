import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import { BasicButton, Divider, Icon, StyledText } from '@opentrons/components'
import { useUpdateSelfMutation } from '@opentrons/react-api-client'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import {
  updateLoggedInUserProfile,
  useLoggedInUserForRobot,
} from '/app/redux/robot-auth'

import styles from './personalaccountsettings.module.css'
import { PersonalAccountSettingsEditForm } from './PersonalAccountSettingsEditForm'

import type { TFunction } from 'i18next'
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

function LoggedOutMessage(): JSX.Element {
  const { t } = useTranslation('device_settings')

  return (
    <div className={styles.logged_out_message}>
      <Icon
        name="information"
        size="1.25rem"
        className={styles.logged_out_icon}
      />
      <StyledText
        desktopStyle="bodyDefaultRegular"
        className={styles.logged_out_message_text}
      >
        {
          t(
            'desktop_login_to_manage_compliance_ready_software_settings'
          ) as string
        }
      </StyledText>
    </div>
  )
}

export function PersonalAccountSettings({
  robotName,
}: PersonalAccountSettingsProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared']) as {
    t: TFunction
  }
  const dispatch = useDispatch()
  const documentationState = useDocumentationState(undefined, robotName)
  const loggedInUser = useLoggedInUserForRobot(robotName)
  const { updateSelf, isLoading: isSaving } =
    useUpdateSelfMutation(documentationState)

  const [isEditing, setIsEditing] = useState(false)

  const handleSave = (request: UpdateSelfRequest): Promise<void> => {
    return updateSelf(request).then(updatedSelf => {
      dispatch(
        updateLoggedInUserProfile({
          robotName,
          username: updatedSelf.data.username,
          fullName: updatedSelf.data.fullName,
        })
      )
      setIsEditing(false)
    })
  }

  const handleCancelEdit = (): void => {
    setIsEditing(false)
  }
  // TODO: refresh fields when user is logged out
  return (
    <div className={styles.container}>
      {loggedInUser == null ? (
        <LoggedOutMessage />
      ) : (
        <>
          <div className={styles.header}>
            <StyledText desktopStyle="bodyLargeSemiBold">
              {t('desktop_personal_account_settings') as string}
            </StyledText>
            {isEditing ? (
              <BasicButton type="button" underLine onClick={handleCancelEdit}>
                {t('shared:cancel')}
              </BasicButton>
            ) : (
              <BasicButton
                type="button"
                underLine
                onClick={() => {
                  setIsEditing(true)
                }}
              >
                {t('desktop_edit')}
              </BasicButton>
            )}
          </div>
          <div className={styles.content}>
            {isEditing ? (
              <PersonalAccountSettingsEditForm
                username={loggedInUser.username}
                fullName={loggedInUser.fullName}
                isSaving={isSaving}
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
                    {loggedInUser.username}
                  </StyledText>
                </FieldRow>
                <Divider />
                <FieldRow label={t('desktop_legal_name')}>
                  <StyledText
                    desktopStyle="bodyDefaultRegular"
                    className={styles.field_value_text}
                  >
                    {loggedInUser.fullName}
                  </StyledText>
                </FieldRow>
                <Divider />
                <FieldRow label={t('desktop_password')}>
                  <StyledText
                    desktopStyle="bodyDefaultRegular"
                    className={styles.field_value_text}
                  >
                    {t('desktop_password_placeholder') as string}
                  </StyledText>
                </FieldRow>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
