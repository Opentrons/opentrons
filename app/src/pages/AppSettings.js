// @flow
// view info about the app and update
import React from 'react'
import {connect} from 'react-redux'
import {Route, Switch, Redirect, type ContextRouter} from 'react-router'
import {push} from 'react-router-redux'

import type {State} from '../types'
import type {ShellUpdate} from '../shell'
import {
  getShellUpdate,
  checkForShellUpdates,
  downloadShellUpdate,
  quitAndInstallShellUpdate,
  setUpdateSeen
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
  const {update, match: {path}} = props

  return (
    <Page>
      <AppSettings {...props} />
      <Switch>
        <Route path={`${path}/update`} render={() => (
          <AppUpdateModal {...props} close={props.closeUpdateModal} />
        )} />
        <Route render={() => {
          if (update.available && !update.seen) {
            return (<Redirect to='/menu/app/update' />)
          }

          return null
        }} />
      </Switch>
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
    closeUpdateModal: () => {
      dispatch(setUpdateSeen())
      dispatch(push('/menu/app'))
    },
    toggleAnalyticsOptedIn: () => dispatch(toggleAnalyticsOptedIn())
  }
}
