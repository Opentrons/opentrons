// @flow
// run task component
import * as React from 'react'
import { Page } from '../../atoms/Page'
import { SessionHeader } from '../../organisms/SessionHeader'
import { RunLog } from './RunLog'

export function Run(): React.Node {
  return (
    <Page titleBarProps={{ title: <SessionHeader /> }}>
      <RunLog />
    </Page>
  )
}
