// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import ModuleData from './ModuleData'
import TemperatureControls from './TemperatureControls'

import { sendModuleCommand } from '../../robot-api'

import type { State, Dispatch } from '../../types'
import type { TempDeckModule, ModuleCommandRequest } from '../../robot-api'
import type { Robot } from '../../discovery'

type OP = {|
  robot: Robot,
  module: TempDeckModule,
|}

type DP = {|
  sendModuleCommand: (request: ModuleCommandRequest) => mixed,
|}

type Props = { ...OP, ...DP }

export default connect<Props, OP, {||}, DP, State, Dispatch>(
  null,
  mapDispatchToProps
)(ModuleControls)

function ModuleControls(props: Props) {
  const { module, sendModuleCommand } = props
  const { currentTemp, targetTemp } = module.data

  return (
    <>
      <ModuleData currentTemp={currentTemp} targetTemp={targetTemp} />
      <TemperatureControls setTemp={sendModuleCommand} />
    </>
  )
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: OP): DP {
  const { robot, module } = ownProps
  const { serial } = module

  return {
    sendModuleCommand: request =>
      dispatch(sendModuleCommand(robot, serial, request)),
  }
}
