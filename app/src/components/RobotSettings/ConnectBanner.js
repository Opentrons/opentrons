// @flow
import { AlertItem } from '@opentrons/components'
import * as React from 'react'

import type { Robot } from '../../discovery/types'

type ConnectBannerState = {| dismissed: boolean |}

export class ConnectBanner extends React.Component<Robot, ConnectBannerState> {
  constructor(props: Robot) {
    super(props)
    this.state = { dismissed: false }
  }

  render(): React.Node {
    const { displayName, connected } = this.props
    const isVisible = connected && !this.state.dismissed
    if (!isVisible) return null

    return (
      <AlertItem
        type="success"
        onCloseClick={() => this.setState({ dismissed: true })}
        title={`${displayName} successfully connected`}
      />
    )
  }
}
