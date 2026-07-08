import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from 'react-query'
import axios from 'axios'

import { BasicButton, Divider, StyledText } from '@opentrons/components'
import {
  getSelfQueryKey,
  useHost,
  useSelfQuery,
  useUpdateSelfMutation,
} from '@opentrons/react-api-client'

import { useUsernameForRobot } from '/app/redux/robot-auth/hooks'

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
  const queryClient = useQueryClient()
  const host = useHost()
  const username = useUsernameForRobot(robotName)
  const { updateSelf, isLoading: isSaving } = useUpdateSelfMutation()
  const { data: selfResponse } = useSelfQuery({ enabled: username != null })

  const [isEditing, setIsEditing] = useState(false)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (username == null) queryClient.removeQueries(getSelfQueryKey(host))
  }, [username, host, queryClient])

  const clearSaveErrors = (): void => {
    setUsernameError(null)
    setSaveError(null)
  }

  const handleSave = (request: UpdateSelfRequest): void => {
    void updateSelf(request)
      .then(updatedSelf => {
        queryClient.setQueryData(getSelfQueryKey(host), updatedSelf)
        clearSaveErrors()
        setIsEditing(false)
      })
      .catch((error: unknown) => {
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
  const fullName = selfResponse?.data.fullName ?? null

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <StyledText desktopStyle="bodyLargeSemiBold">
          {t('desktop_personal_account_settings')}
        </StyledText>
        {username != null &&
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
        {isEditing ? (
          <PersonalAccountSettingsEditForm
            username={username}
            fullName={fullName}
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
