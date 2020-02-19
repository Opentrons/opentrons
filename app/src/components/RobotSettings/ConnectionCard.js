// @flow
// RobotSettings card for wifi status
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { Card, useInterval } from '@opentrons/components'
import { CONNECTABLE } from '../../discovery'
import {
  fetchStatus,
  getInternetStatus,
  getNetworkInterfaces,
} from '../../networking'
import { SelectNetwork } from './SelectNetwork'
import { ConnectionStatusMessage, ConnectionInfo } from './connection'

import type { State, Dispatch } from '../../types'
import type { ViewableRobot } from '../../discovery/types'

type Props = {| robot: ViewableRobot |}

const CONNECTIVITY = 'Connectivity'
const STATUS_REFRESH_MS = 5000

export function ConnectionCard(props: Props) {
  const { robot } = props
  const { name: robotName, status, local } = robot
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
    <Card title={CONNECTIVITY} disabled={disabled}>
      <ConnectionStatusMessage
        type={local ? 'USB' : 'Wi-Fi'}
        status={internetStatus}
      />
      <ConnectionInfo connection={wifi} title="Wi-Fi" disabled={disabled}>
        <SelectNetwork robot={robot} />
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
