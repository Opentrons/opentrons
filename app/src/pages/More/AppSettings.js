// @flow
// view info about the app and update
import * as React from 'react'
import { connect } from 'react-redux'
import { Route, Switch, Redirect, type ContextRouter } from 'react-router-dom'
import { push } from 'connected-react-router'

import {
  getShellUpdateState,
  getAvailableShellUpdate,
  checkShellUpdate,
  downloadShellUpdate,
  applyShellUpdate,
  setShellUpdateSeen,
} from '../../shell'

import { Page } from '../../components/Page'
import { AppSettings as AppSettingsContents } from '../../components/AppSettings'
import { UpdateApp } from '../../components/AppSettings/UpdateApp'
import { ErrorModal } from '../../components/modals'

import type { State, Dispatch } from '../../types'
import type { ShellUpdateState } from '../../shell/types'

type OP = ContextRouter

type SP = {|
  update: ShellUpdateState,
  availableVersion: ?string,
|}

type DP = {|
  checkUpdate: () => mixed,
  downloadUpdate: () => mixed,
  applyUpdate: () => mixed,
  closeModal: () => mixed,
|}

type Props = {| ...OP, ...SP, ...DP |}

export const AppSettings = connect<Props, OP, SP, DP, State, Dispatch>(
  mapStateToProps,
  mapDispatchToProps
)(AppSettingsComponent)

function AppSettingsComponent(props: Props) {
  const {
    availableVersion,
    checkUpdate,
    downloadUpdate,
    applyUpdate,
    closeModal,
    update,
  } = props
  const { available, seen, error } = update
  const { path } = props.match

  return (
    <>
      <Page titleBarProps={{ title: 'App' }}>
        <AppSettingsContents
          availableVersion={availableVersion}
          checkUpdate={checkUpdate}
        />
      </Page>
      <Switch>
        <Route
          path={`${path}/update`}
          render={() =>
            !error ? (
              <UpdateApp
                {...{
                  update,
                  availableVersion,
                  downloadUpdate,
                  applyUpdate,
                  closeModal,
                }}
              />
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
    </>
  )
}

function mapStateToProps(state: State): SP {
  return {
    update: getShellUpdateState(state),
    availableVersion: getAvailableShellUpdate(state),
  }
}

function mapDispatchToProps(dispatch: Dispatch): DP {
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
