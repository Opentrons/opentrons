// @flow
// run task component
import React from 'react'
import {Route} from 'react-router'
import Page from '../components/Page'
import SessionHeader from '../components/SessionHeader'
import RunLog from '../components/RunLog'
import ConfirmCancelModal from '../components/RunLog/ConfirmCancelModal'

export default function RunPage () {
  return (
    <Page>
      <SessionHeader />
      <RunLog />
      <Route path='/run/cancel' render={() => (
        <ConfirmCancelModal />
      )} />
    </Page>
  )
}
