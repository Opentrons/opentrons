// @flow
import * as React from 'react'

import {Icon, VerticalNavBar} from '@opentrons/components'
import ConnectedStepList from '../containers/ConnectedStepList'

export default function ProtocolEditor () {
  return (
    <div>
      <div style={{height: '100%', float: 'left'}}> {/* TODO: Ian 2018-01-11 do real styles or use structure in complib... this is quick HACK */}
        <VerticalNavBar>
          <Icon name='file' />
          <Icon name='cog' />
        </VerticalNavBar>
      </div>
      <ConnectedStepList />
    </div>
  )
}
