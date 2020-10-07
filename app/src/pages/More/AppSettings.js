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
  setShellUpdateSeen,
} from '../../shell'

import { Page } from '../../components/Page'
import {
  AppSettings as AppSettingsContents,
  UpdateAppModal,
} from '../../components/AppSettings'

import type { State, Dispatch } from '../../types'
import type { ShellUpdateState } from '../../shell/types'

type OP = ContextRouter

type SP = {|
  update: ShellUpdateState,
  availableVersion: ?string,
|}

type DP = {|
  checkUpdate: () => void,
  closeModal: () => mixed,
|}

type Props = {| ...OP, ...SP, ...DP |}

export const AppSettings: React.AbstractComponent<OP> = connect<
  Props,
  OP,
  SP,
  DP,
  State,
  Dispatch
>(
  mapStateToProps,
  mapDispatchToProps
)(AppSettingsComponent)

function AppSettingsComponent(props: Props) {
  const { availableVersion, checkUpdate, closeModal, update } = props
  const { available, seen } = update
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
          render={() => <UpdateAppModal closeModal={closeModal} />}
        />
        <Route
          render={() =>
            available && !seen ? <Redirect to="/more/app/update" /> : null
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
    checkUpdate: () => {
      dispatch(checkShellUpdate())
    },
    closeModal: () => {
      dispatch(setShellUpdateSeen())
      dispatch(push('/more/app'))
    },
  }
}
