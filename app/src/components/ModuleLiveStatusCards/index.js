// @flow
import * as React from 'react'
import { connect } from 'react-redux'

import { getConnectedRobot } from '../../discovery'
import {
  getModulesState,
  sendModuleCommand,
  type ModuleCommandRequest,
  type Module,
} from '../../robot-api'
import { selectors as robotSelectors } from '../../robot'
import { getConfig } from '../../config'

import type { State, Dispatch } from '../../types'
import type { Robot } from '../../discovery'

import TempDeckCard from './TempDeckCard'
import MagDeckCard from './MagDeckCard'
import ThermocyclerCard from './ThermocyclerCard'

const LIVE_STATUS_MODULES = ['magdeck', 'tempdeck', 'thermocycler']

type SP = {|
  _robot: ?Robot,
  liveStatusModules: Array<Module>,
  isProtocolActive: boolean,
  __tempdeckControlsEnabled: boolean,
|}

type DP = {|
  _sendModuleCommand: (
    _robot: Robot,
    serial: string,
    request: ModuleCommandRequest
  ) => mixed,
|}

type Props = {|
  liveStatusModules: Array<Module>,
  isProtocolActive: boolean,
  sendModuleCommand: (serial: string, request: ModuleCommandRequest) => mixed,
  __tempdeckControlsEnabled: boolean,
|}

const ModuleLiveStatusCards = (props: Props) => {
  const {
    liveStatusModules,
    isProtocolActive,
    sendModuleCommand,
    __tempdeckControlsEnabled,
  } = props

  if (liveStatusModules.length === 0) return null

  // TODO: IMMEDIATELY useSelector, useDispatch, useState
  // state to track expanded serial, if no expanded serial default
  // first in the list on mount.

  return (
    <>
      {liveStatusModules.map((module, index) => {
        switch (module.name) {
          case 'tempdeck':
            return (
              <TempDeckCard
                key={module.serial}
                module={module}
                initiallyExpanded={index === 0}
                sendModuleCommand={sendModuleCommand}
                isProtocolActive={isProtocolActive}
                __tempdeckControlsEnabled={__tempdeckControlsEnabled}
              />
            )
          case 'thermocycler':
            return (
              <ThermocyclerCard
                key={module.serial}
                module={module}
                initiallyExpanded={index === 0}
                sendModuleCommand={sendModuleCommand}
                isProtocolActive={isProtocolActive}
              />
            )
          case 'magdeck':
            return (
              <MagDeckCard
                key={module.serial}
                module={module}
                initiallyExpanded={index === 0}
              />
            )
          default:
            return null
        }
      })}
    </>
  )
}

function mapStateToProps(state: State): SP {
  const _robot = getConnectedRobot(state)
  const modules = _robot ? getModulesState(state, _robot.name) : []

  const liveStatusModules = modules.filter(m =>
    LIVE_STATUS_MODULES.includes(m.name)
  )

  return {
    _robot,
    liveStatusModules,
    isProtocolActive: robotSelectors.getIsActive(state),
    __tempdeckControlsEnabled: Boolean(
      getConfig(state).devInternal?.tempdeckControls
    ),
  }
}

function mapDispatchToProps(dispatch: Dispatch): DP {
  return {
    _sendModuleCommand: (_robot, serial, request) =>
      dispatch(sendModuleCommand(_robot, serial, request)),
  }
}

function mergeProps(stateProps: SP, dispatchProps: DP): Props {
  const { _sendModuleCommand } = dispatchProps
  const {
    _robot,
    liveStatusModules,
    isProtocolActive,
    __tempdeckControlsEnabled,
  } = stateProps

  return {
    liveStatusModules,
    isProtocolActive,
    sendModuleCommand: (serial, request) =>
      _robot && _sendModuleCommand(_robot, serial, request),
    __tempdeckControlsEnabled,
  }
}

export default connect<Props, {||}, SP, DP, State, Dispatch>(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(ModuleLiveStatusCards)
