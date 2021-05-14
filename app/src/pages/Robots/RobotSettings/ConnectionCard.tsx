// RobotSettings card for wifi status
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'

import { Card, useInterval } from '@opentrons/components'
import { CONNECTABLE } from '../../../redux/discovery'
import {
  fetchStatus,
  getInternetStatus,
  getNetworkInterfaces,
} from '../../../redux/networking'
import { SelectNetwork } from './SelectNetwork'
import { ConnectionStatusMessage, ConnectionInfo } from './connection'

import type { State, Dispatch } from '../../../redux/types'
import type { ViewableRobot } from '../../../redux/discovery/types'

interface Props {
  robot: ViewableRobot
}

const STATUS_REFRESH_MS = 5000

export function ConnectionCard(props: Props): JSX.Element {
  const { robot } = props
  const { name: robotName, status, local, ip } = robot
  const { t } = useTranslation('robot_connection')
  const dispatch = useDispatch<Dispatch>()
  const internetStatus = useSelector((state: State) =>
    getInternetStatus(state, robotName)
  )
  const { wifi, ethernet } = useSelector((state: State) =>
    getNetworkInterfaces(state, robotName)
  )
  const disabled = status !== CONNECTABLE

  useInterval(() => dispatch(fetchStatus(robotName)), STATUS_REFRESH_MS, true)

  return (
    <Card key={robotName} title={t('title')}>
      <ConnectionStatusMessage
        type={local ? 'USB' : 'Wi-Fi'}
        status={status}
        internetStatus={internetStatus}
        ipAddress={ip}
      />
      <ConnectionInfo connection={wifi} title="Wi-Fi" disabled={disabled}>
        <SelectNetwork robotName={robotName} />
      </ConnectionInfo>
      <ConnectionInfo
        connection={ethernet}
        title="USB"
        wired
        disabled={disabled}
      />
    </Card>
  )
}
