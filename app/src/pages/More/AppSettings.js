// @flow
// view info about the app and update
import * as React from 'react'
import {connect} from 'react-redux'
import {Route, Switch, Redirect, type ContextRouter} from 'react-router'
import {push} from 'react-router-redux'

import {
  getShellUpdateState,
  getAvailableShellUpdate,
  checkShellUpdate,
  downloadShellUpdate,
  applyShellUpdate,
  setShellUpdateSeen,
} from '../../shell'

import Page from '../../components/Page'
import AppSettings, {AppUpdateModal} from '../../components/AppSettings'
import {ErrorModal} from '../../components/modals'

import type {State} from '../../types'
import type {ShellUpdateState} from '../../shell'

type OP = ContextRouter

type SP = {
  update: ShellUpdateState,
  availableVersion: ?string,
}

type DP = {
  checkUpdate: () => mixed,
  downloadUpdate: () => mixed,
  applyUpdate: () => mixed,
  closeModal: () => mixed,
}

type Props = OP & SP & DP

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AppSettingsPage)

function AppSettingsPage (props: Props) {
  const {
    availableVersion,
    checkUpdate,
    closeModal,
    update: {available, seen, error},
    match: {path},
  } = props

  return (
    <React.Fragment>
      <Page titleBarProps={{title: 'App'}}>
        <AppSettings
          availableVersion={availableVersion}
          checkUpdate={checkUpdate}
        />
      </Page>
      <Switch>
        <Route
          path={`${path}/update`}
          render={() =>
            !error ? (
              <AppUpdateModal {...props} />
            ) : (
              <ErrorModal
                heading="Update Error"
                description="Something went wrong while updating your app"
                close={closeModal}
                error={error}
              />
            )
          }
        />
        <Route
          render={() =>
            available && !seen ? <Redirect to="/menu/app/update" /> : null
          }
        />
      </Switch>
    </React.Fragment>
  )
}

function mapStateToProps (state: State): SP {
  return {
    update: getShellUpdateState(state),
    availableVersion: getAvailableShellUpdate(state),
  }
}

function mapDispatchToProps (dispatch: Dispatch): DP {
  return {
    checkUpdate: () => dispatch(checkShellUpdate()),
    downloadUpdate: () => dispatch(downloadShellUpdate()),
    applyUpdate: () => dispatch(applyShellUpdate()),
    closeModal: () => {
      dispatch(setShellUpdateSeen())
      dispatch(push('/menu/app'))
    },
  }
}
