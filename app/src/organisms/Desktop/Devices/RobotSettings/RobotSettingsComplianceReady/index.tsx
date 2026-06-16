import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { COLORS, Divider, StyledText } from '@opentrons/components'
import { useSelfQuery } from '@opentrons/react-api-client'

import { getAuthStateForRobot } from '/app/redux/robot-auth'

import styles from './robotsettingscomplianceready.module.css'

import type { JSX } from 'react'
import type { State } from '/app/redux/types'

export interface RobotSettingsComplianceReadyProps {
  robotName: string
  isRobotBusy: boolean
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
        <StyledText desktopStyle="bodyLargeSemiBold">
          {t('desktop_personal_account_settings')}
        </StyledText>
        <StyledText desktopStyle="bodyDefaultRegLink">
          {t('desktop_edit')}
        </StyledText>
      </div>
      <div className={styles.content}>
        <StyledText desktopStyle="bodyDefaultSemiBold">
          {t('desktop_username')}
        </StyledText>
        <StyledText
          desktopStyle="bodyDefaultRegular"
          color={COLORS.grey60}
          className={styles.field_value}
        >
          {username}
        </StyledText>
        <Divider className={styles.divider} />
        <StyledText desktopStyle="bodyDefaultSemiBold">
          {t('desktop_legal_name')}
        </StyledText>
        <StyledText
          desktopStyle="bodyDefaultRegular"
          color={COLORS.grey60}
          className={styles.field_value}
        >
          {fullName}
        </StyledText>
        <Divider className={styles.divider} />
        <StyledText desktopStyle="bodyDefaultSemiBold">
          {t('desktop_password')}
        </StyledText>
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
      </div>
    </div>
  )
}
