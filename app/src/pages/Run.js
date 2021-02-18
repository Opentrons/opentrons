// @flow
// run task component
import * as React from 'react'
import { Page } from '../components/Page'
import { SessionHeader } from '../components/SessionHeader'
import { RunLog } from '../components/RunLog'

export function Run(): React.Node {
  return (
    <Page titleBarProps={{ title: <SessionHeader /> }}>
      <RunLog />
    </Page>
  )
}
