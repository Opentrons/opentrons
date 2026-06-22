import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { Divider, StyledText } from '@opentrons/components'
import { useSelfQuery } from '@opentrons/react-api-client'

import { getAuthStateForRobot } from '/app/redux/robot-auth'

import styles from './personalaccountsettings.module.css'

import type { JSX, ReactNode } from 'react'
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
  const { t } = useTranslation('device_settings')
  const authState = useSelector((state: State) =>
    getAuthStateForRobot(state, robotName)
  )
  const selfQuery = useSelfQuery({ enabled: authState != null })
  const username = authState?.username
  const fullName = selfQuery.data?.data.fullName ?? null

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <StyledText desktopStyle="bodyLargeSemiBold">
          {t('desktop_personal_account_settings')}
        </StyledText>
        <button type="button" className={styles.edit_button}>
          <StyledText desktopStyle="bodyDefaultRegLink">
            {t('desktop_edit')}
          </StyledText>
        </button>
      </div>
      <div className={styles.content}>
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
            {/* TODO(tz, 2026-06-18): mask password from api */}
            ••••••••
          </StyledText>
        </FieldRow>
      </div>
    </div>
  )
}
