// @flow
// run task component
import * as React from 'react'
import { Route } from 'react-router-dom'
import { Page } from '../../atoms/Page'
import { SessionHeader } from '../../organisms/SessionHeader'
import { RunLog, ConfirmCancelModal } from './RunLog'

export function Run(): React.Node {
  return (
    <>
      <Page titleBarProps={{ title: <SessionHeader /> }}>
        <RunLog />
      </Page>
      <Route path="/run/cancel" component={ConfirmCancelModal} />
    </>
  )
}
