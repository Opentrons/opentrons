// @flow
// run task component
import React from 'react'
import {Route} from 'react-router'
import Page, {PageWrapper} from '../components/Page'
import SessionHeader from '../components/SessionHeader'
import RunLog, {ConfirmCancelModal} from '../components/RunLog'

export default function RunPage () {
  return (
    <PageWrapper>
      <Page
        titleBarProps={{title: (<SessionHeader />)}}
      >
        <RunLog />
      </Page>
      <Route path='/run/cancel' component={ConfirmCancelModal} />
    </PageWrapper>
  )
}
