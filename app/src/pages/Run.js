// @flow
// run task component
import * as React from 'react'
import {Route} from 'react-router'
import Page from '../components/Page'
import SessionHeader from '../components/SessionHeader'
import RunLog, {ConfirmCancelModal} from '../components/RunLog'

export default function RunPage () {
  return (
    <React.Fragment>
      <Page
        titleBarProps={{title: (<SessionHeader />)}}
      >
        <RunLog />
      </Page>
      <Route path='/run/cancel' component={ConfirmCancelModal} />
    </React.Fragment>
  )
}
