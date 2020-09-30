// @flow
// run task component
import * as React from 'react'
import { Route } from 'react-router-dom'
import { Page } from '../components/Page'
import { SessionHeader } from '../components/SessionHeader'
import { RunLog, ConfirmCancelModal } from '../components/RunLog'

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
