// run task component
import React from 'react'

import Page from '../components/Page'
import SessionHeader from '../components/SessionHeader'
import RunLog from '../components/RunLog'

export default function RunPage () {
  return (
    <Page>
      <SessionHeader />
      <RunLog />
    </Page>
  )
}
