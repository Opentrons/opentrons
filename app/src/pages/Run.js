// @flow
// run task component
import React from 'react'
import {Route} from 'react-router'
import Page from '../components/Page'
import SessionHeader from '../components/SessionHeader'
import RunLog, {ConfirmCancelModal} from '../components/RunLog'

export default function RunPage () {
  return (
    <Page
      titleBar={{title: (<SessionHeader />)}}
      modals={(<Route path='/run/cancel' component={ConfirmCancelModal} />)}
    >

      <RunLog />
    </Page>
  )
}
