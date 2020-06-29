// @flow
// run task component
import * as React from 'react'
import { Route } from 'react-router-dom'

import { Page } from '../components/Page'
import { ConfirmCancelModal, RunLog } from '../components/RunLog'
import { SessionHeader } from '../components/SessionHeader'

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
