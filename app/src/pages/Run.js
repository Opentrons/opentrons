// run task component
import React from 'react'

import Page from '../components/Page'
import SessionHeader from '../containers/SessionHeader'
import ConnectedRunLog from '../containers/ConnectedRunLog'

export default function RunPage () {
  return (
    <Page>
      <SessionHeader />
      <ConnectedRunLog />
    </Page>
  )
}
