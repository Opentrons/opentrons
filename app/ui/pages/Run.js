// run task component
import React from 'react'

import Page from '../components/Page'
import ConnectedRunControl from '../containers/ConnectedRunControl'
import ConnectedRunLog from '../containers/ConnectedRunLog'

export default function RunPage () {
  return (
    <Page>
      <ConnectedRunControl />
      <ConnectedRunLog />
    </Page>
  )
}
