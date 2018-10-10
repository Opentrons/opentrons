// @flow
import * as React from 'react'
import {AlertItem} from '@opentrons/components'

import type {ReachableRobot} from '../../discovery'

type State = {dismissed: boolean}

export default class ReachableRobotBanner extends React.Component<
  ReachableRobot,
  State
> {
  constructor (props: ReachableRobot) {
    super(props)
    this.state = {dismissed: false}
  }

  render () {
    const {serverOk} = this.props
    const isVisible = !this.state.dismissed
    const TITLE = 'Unable to establish connection with robot'
    const NO_SERVER_MESSAGE =
      'Robot is advertising but cannot boot any of its servers.'
    const SERVER_MESSAGE =
      'Robot is advertising and can only boot update server'
    const message = serverOk ? SERVER_MESSAGE : NO_SERVER_MESSAGE
    if (!isVisible) {
      return null
    }
    return (
      <AlertItem
        type="warning"
        onCloseClick={() => this.setState({dismissed: true})}
        title={TITLE}
      >
        {message}
      </AlertItem>
    )
  }
}
