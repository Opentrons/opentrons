// @flow
import * as React from 'react'
import { AlertItem } from '@opentrons/components'
import styles from './styles.css'

import type { ReachableRobot } from '../../discovery/types'

type State = { dismissed: boolean }

const UNRESPONSIVE_TITLE = 'Unable to establish connection with robot'

const LAST_RESORT = (
  <p>
    If your robot remains unresponsive, please reach out to our Support team.
  </p>
)

const NO_SERVER_MESSAGE = (
  <div className={styles.banner}>
    <p>
      Your robot is advertising its IP address but is not responding to
      requests.
    </p>
    <p>We recommend power-cycling your robot.</p>
    {LAST_RESORT}
  </div>
)

const SERVER_MESSAGE = (
  <div className={styles.banner}>
    <p>Your robot&apos;s API server is not responding.</p>
    <p>We recommend the following troubleshooting steps:</p>
    <ol>
      <li>
        <p>Power-cycle your robot</p>
      </li>
      <li>
        <p>
          If power-cycling does not work, please update your robot&apos;s
          software
          <br />
          (Note: your robot&apos;s update server is still responding and should
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

  render() {
    const { serverOk } = this.props
    const isVisible = !this.state.dismissed
    const message = serverOk ? SERVER_MESSAGE : NO_SERVER_MESSAGE

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
