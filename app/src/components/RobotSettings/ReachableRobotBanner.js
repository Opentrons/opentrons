// @flow
import * as React from 'react'
import { AlertItem } from '@opentrons/components'
import styles from './styles.css'

import {
  HEALTH_STATUS_OK,
  HEALTH_STATUS_NOT_OK,
  HEALTH_STATUS_UNREACHABLE,
} from '../../discovery'

import type { ReachableRobot, HealthStatus } from '../../discovery/types'

type State = {| dismissed: boolean |}

const UNRESPONSIVE_TITLE = 'Unable to establish connection with robot'

const STATUS_DESCRIPTION = {
  [HEALTH_STATUS_OK]: 'responding to requests',
  [HEALTH_STATUS_NOT_OK]: 'not responding correctly to requests',
  [HEALTH_STATUS_UNREACHABLE]: 'not reachable',
}

const LAST_RESORT = (
  <p>
    If your robot remains unresponsive, please reach out to our Support team.
  </p>
)

const NO_SERVER_MESSAGE = (serverStatus: HealthStatus, ip: string) => (
  <div className={styles.banner}>
    <p>
      This OT-2 has been seen recently, but it is currently{' '}
      {STATUS_DESCRIPTION[serverStatus]} at IP address {ip}.
    </p>
    <p>We recommend power-cycling your robot.</p>
    {LAST_RESORT}
  </div>
)

const SERVER_MESSAGE = (status: HealthStatus, ip: string) => (
  <div className={styles.banner}>
    <p>
      Your {"OT-2's"} API server is {STATUS_DESCRIPTION[status]} at IP address{' '}
      {ip}.
    </p>
    <p>We recommend the following troubleshooting steps:</p>
    <ol>
      <li>
        <p>Power-cycle your robot</p>
      </li>
      <li>
        <p>
          If power-cycling does not work, please update your {"robot's"}
          software
          <br />
          (Note: your {"robot's"} update server is still responding and should
          accept an update.)
        </p>
      </li>
    </ol>
    {LAST_RESORT}
  </div>
)

export class ReachableRobotBanner extends React.Component<
  ReachableRobot,
  State
> {
  constructor(props: ReachableRobot) {
    super(props)
    this.state = { dismissed: false }
  }

  render(): React.Node {
    const { ip, healthStatus, serverHealthStatus } = this.props
    const isVisible = !this.state.dismissed
    const message =
      serverHealthStatus === HEALTH_STATUS_OK
        ? SERVER_MESSAGE(healthStatus, ip)
        : NO_SERVER_MESSAGE(serverHealthStatus, ip)

    if (!isVisible) return null

    return (
      <AlertItem
        type="warning"
        onCloseClick={() => this.setState({ dismissed: true })}
        title={UNRESPONSIVE_TITLE}
      >
        {message}
      </AlertItem>
    )
  }
}
