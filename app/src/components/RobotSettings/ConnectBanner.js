// @flow
import * as React from 'react'
import {AlertItem} from '@opentrons/components'

import {type Robot} from '../../discovery'

type State = {dismissed: boolean}

export default class ConnectBanner extends React.Component<Robot, State> {
  constructor (props: Robot) {
    super(props)
    this.state = {dismissed: false}
  }

  render () {
    const {name, connected} = this.props
    const isVisible = connected && !this.state.dismissed
    const TITLE = `${name} successfully connected`

    if (!isVisible) return null
    return (
      <AlertItem
        type="success"
        onCloseClick={() => this.setState({dismissed: true})}
        title={TITLE}
      />
    )
  }
}
