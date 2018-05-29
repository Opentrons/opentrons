// @flow
// view info about the app and update
import React from 'react'
import {connect} from 'react-redux'
import {Route, type ContextRouter} from 'react-router'
import {push} from 'react-router-redux'

import type {State} from '../types'
import type {ShellUpdate} from '../shell'
import {
  getShellUpdate,
  checkForShellUpdates,
  downloadShellUpdate,
  quitAndInstallShellUpdate
} from '../shell'
import {toggleAnalyticsOptedIn, getAnalyticsOptedIn} from '../analytics'

import Page from '../components/Page'
import AppSettings, {AppUpdateModal} from '../components/AppSettings'

type OP = ContextRouter

type SP = {
  update: ShellUpdate,
  analyticsOptedIn: boolean,
}

type DP = {
  checkForUpdates: () => mixed,
  downloadUpdate: () => mixed,
  quitAndInstall: () => mixed,
  closeUpdateModal: () => mixed,
  toggleAnalyticsOptedIn: () => mixed,
}

type Props = OP & SP & DP

export default connect(mapStateToProps, mapDispatchToProps)(AppSettingsPage)

function AppSettingsPage (props: Props) {
  return (
    <Page>
      <AppSettings {...props} />
      <Route path='/menu/app/update' render={() => (
        <AppUpdateModal {...props} close={props.closeUpdateModal} />
      )} />
    </Page>
  )
}

function mapStateToProps (state: State): SP {
  return {
    update: getShellUpdate(state),
    analyticsOptedIn: getAnalyticsOptedIn(state)
  }
}

function mapDispatchToProps (dispatch: Dispatch): DP {
  return {
    checkForUpdates: () => dispatch(checkForShellUpdates()),
    downloadUpdate: () => dispatch(downloadShellUpdate()),
    quitAndInstall: () => quitAndInstallShellUpdate(),
    closeUpdateModal: () => dispatch(push('/menu/app')),
    toggleAnalyticsOptedIn: () => dispatch(toggleAnalyticsOptedIn())
  }
}
