import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from 'react-query'
import { useSelector } from 'react-redux'

import { Divider, StyledText } from '@opentrons/components'
import {
  getSelfQueryKey,
  useHost,
  useSelfQuery,
  useUpdateSelfMutation,
} from '@opentrons/react-api-client'

import { getAuthStateForRobot } from '/app/redux/robot-auth'

import styles from './personalaccountsettings.module.css'
import { PersonalAccountSettingsEditForm } from './PersonalAccountSettingsEditForm'

import type { JSX, ReactNode } from 'react'
import type { UpdateSelfRequest } from '@opentrons/api-client'
import type { State } from '/app/redux/types'

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
  const authState = useSelector((state: State) =>
    getAuthStateForRobot(state, robotName)
  )
  const selfQuery = useSelfQuery({ enabled: authState != null })
  const { updateSelf, isLoading: isSaving } = useUpdateSelfMutation()
  const username = selfQuery.data?.data.username ?? authState?.username ?? ''
  const fullName = selfQuery.data?.data.fullName ?? ''

  const [isEditing, setIsEditing] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const handleSave = (updateData: UpdateSelfRequest['data']): void => {
    void updateSelf({ data: updateData })
      .then(() => {
        void queryClient.invalidateQueries(getSelfQueryKey(host))
        setSaveError(null)
        setIsEditing(false)
      })
      .catch(() => {
        setSaveError(t('desktop_personal_account_settings_save_error'))
      })
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <StyledText desktopStyle="bodyLargeSemiBold">
          {t('desktop_personal_account_settings')}
        </StyledText>
        {isEditing ? (
          <button
            type="button"
            className={styles.edit_button}
            onClick={() => {
              setSaveError(null)
              setIsEditing(false)
            }}
          >
            <StyledText desktopStyle="bodyDefaultRegLink">
              {t('shared:cancel')}
            </StyledText>
          </button>
        ) : (
          <button
            type="button"
            className={styles.edit_button}
            onClick={() => {
              setSaveError(null)
              setIsEditing(true)
            }}
          >
            <StyledText desktopStyle="bodyDefaultRegLink">
              {t('desktop_edit')}
            </StyledText>
          </button>
        )}
      </div>
      <div className={styles.content}>
        {isEditing ? (
          <PersonalAccountSettingsEditForm
            username={username}
            fullName={fullName}
            isSaving={isSaving}
            saveError={saveError}
            onSave={handleSave}
            onCancel={() => {
              setSaveError(null)
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
                ••••••••
              </StyledText>
            </FieldRow>
          </>
        )}
      </div>
    </div>
  )
}
