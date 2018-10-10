// @flow
import * as React from 'react'
import {AlertItem} from '@opentrons/components'

import type {ReachableRobot} from '../../discovery'

type State = {dismissed: boolean}

const TITLE = 'Unable to establish connection with robot'
// TODO(mc, 2018-10-10): this copy isn't necessarily accurate
const NO_SERVER_MESSAGE =
  'Robot is advertising but cannot boot any of its servers.'
// TODO(mc, 2018-10-10): this copy isn't necessarily accurate
const SERVER_MESSAGE = 'Robot is advertising and can only boot update server.'

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
    const message = serverOk ? SERVER_MESSAGE : NO_SERVER_MESSAGE

    if (!isVisible) return null

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
