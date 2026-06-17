import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { Divider, StyledText } from '@opentrons/components'
import { useSelfQuery } from '@opentrons/react-api-client'

import { getAuthStateForRobot } from '/app/redux/robot-auth'

import styles from './robotsettingscomplianceready.module.css'

import type { JSX, ReactNode } from 'react'
import type { State } from '/app/redux/types'

export interface RobotSettingsComplianceReadyProps {
  robotName: string
  isRobotBusy: boolean
}

interface FieldRowProps {
  label: string
  children: ReactNode
}

function FieldRow({ label, children }: FieldRowProps): JSX.Element {
  return (
    <div className={styles.field_row}>
      <div className={styles.field_label}>
        <StyledText desktopStyle="bodyDefaultSemiBold">{label}</StyledText>
      </div>
      <div className={styles.field_value}>{children}</div>
    </div>
  )
}

export function RobotSettingsComplianceReady({
  robotName,
}: RobotSettingsComplianceReadyProps): JSX.Element {
  const { t } = useTranslation('access_control')
  const authState = useSelector((state: State) =>
    getAuthStateForRobot(state, robotName)
  )
  const selfQuery = useSelfQuery({ enabled: authState != null })
  const username = authState?.username ?? selfQuery.data?.data.username ?? null
  const fullName = selfQuery.data?.data.fullName ?? null
  const isProfileLoaded = selfQuery.isSuccess

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <StyledText desktopStyle="bodyDefaultRegular">
          {t('desktop_personal_account_settings')}
        </StyledText>
        <a
          href={`/devices/${robotName}/robot-settings/compliance-ready`}
          className={styles.edit_link}
        >
          {t('desktop_edit')}
        </a>
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
          {isProfileLoaded ? (
            <input
              type="password"
              readOnly
              value="password"
              className={styles.masked_password_input}
              tabIndex={-1}
              aria-hidden
            />
          ) : null}
        </FieldRow>
      </div>
    </div>
  )
}
