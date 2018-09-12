// @flow
import * as React from 'react'
import {type Robot} from '../../robot'
import {AlertItem} from '@opentrons/components'

type State = {
  dismissed: boolean,
}

export default class ConnectBanner extends React.Component <Robot, State> {
  constructor (props: Robot) {
    super(props)

    this.state = {
      dismissed: false,
    }
  }

  render () {
    const {isConnected, name} = this.props
    const isVisible = isConnected && !this.state.dismissed
    const TITLE = `${name} successfully connected`
    if (!isVisible) {
      return null
    }
    return (
      <AlertItem
        type='success'
        onCloseClick={() => this.setState({dismissed: true})}
        title={TITLE} />
    )
  }
}
