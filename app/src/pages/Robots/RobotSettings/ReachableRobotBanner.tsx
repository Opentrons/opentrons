import * as React from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { AlertItem } from '@opentrons/components'
import styles from './styles.css'

import {
  HEALTH_STATUS_OK,
  HEALTH_STATUS_NOT_OK,
  HEALTH_STATUS_UNREACHABLE,
} from '../../../redux/discovery'

import type { ReachableRobot } from '../../../redux/discovery/types'

export function ReachableRobotBanner(
  props: ReachableRobot
): JSX.Element | null {
  const { t } = useTranslation('robot_connection')
  const [dismissed, setDismissed] = React.useState(false)

  const { ip, healthStatus, serverHealthStatus } = props
  const isVisible = !dismissed

  const STATUS_DESCRIPTION = {
    [HEALTH_STATUS_OK]: t('health_status_ok'),
    [HEALTH_STATUS_NOT_OK]: t('health_status_not_ok'),
    [HEALTH_STATUS_UNREACHABLE]: t('health_status_unreachable'),
  }
  const message =
    serverHealthStatus === HEALTH_STATUS_OK ? (
      <Trans
        t={t}
        i18nKey="server_message"
        tOptions={{ status: STATUS_DESCRIPTION[healthStatus], ip: ip }}
        components={{ block: <p />, ol: <ol />, li: <li />, br: <br /> }}
      />
    ) : (
      <Trans
        t={t}
        i18nKey="no_server_message"
        tOptions={{ status: STATUS_DESCRIPTION[serverHealthStatus], ip: ip }}
        components={{ block: <p /> }}
      />
    )

  if (!isVisible) return null

  return (
    <AlertItem
      type="warning"
      onCloseClick={() => setDismissed(true)}
      title={t('unresponsive_title')}
    >
      <div className={styles.banner}>
        {message}
        <p>{t('last_resort')}</p>
      </div>
    </AlertItem>
  )
}
