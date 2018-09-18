// @flow
// view info about the app and update
import * as React from 'react'
import {connect} from 'react-redux'
import {Route, Switch, Redirect, type ContextRouter} from 'react-router'
import {push} from 'react-router-redux'

import type {State} from '../../types'
import type {ShellUpdateState} from '../../shell'
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

type OP = ContextRouter

type SP = {
  update: ShellUpdateState,
  availableVersion: ?string,
}

type DP = {
  checkUpdate: () => mixed,
  downloadUpdate: () => mixed,
  applyUpdate: () => mixed,
  closeUpdateModal: () => mixed,
}

type Props = OP & SP & DP

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AppSettingsPage)

function AppSettingsPage (props: Props) {
  const {
    update,
    match: {path},
  } = props

  return (
    <React.Fragment>
      <Page titleBarProps={{title: 'App'}}>
        <AppSettings {...props} />
      </Page>
      <Switch>
        <Route
          path={`${path}/update`}
          render={() => (
            <AppUpdateModal {...props} close={props.closeUpdateModal} />
          )}
        />
        <Route
          render={() => {
            if (update.available && !update.seen) {
              return <Redirect to="/menu/app/update" />
            }

            return null
          }}
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
    closeUpdateModal: () => {
      dispatch(setShellUpdateSeen())
      dispatch(push('/menu/app'))
    },
  }
}
