// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import ModuleData from './ModuleData'
import TemperatureControls from './TemperatureControls'

import { setTargetTemp } from '../../robot-api'

import type { State, Dispatch } from '../../types'
import type { TempDeckModule, ModuleCommandRequest } from '../../robot-api'
import type { Robot } from '../../discovery'

type OP = {|
  robot: Robot,
  module: TempDeckModule,
|}

type DP = {|
  setTargetTemp: (request: ModuleCommandRequest) => mixed,
|}

type Props = { ...OP, ...DP }

export default connect<Props, OP, {||}, DP, State, Dispatch>(
  null,
  mapDispatchToProps
)(ModuleControls)

function ModuleControls(props: Props) {
  const { module, setTargetTemp } = props
  const { currentTemp, targetTemp } = module.data

  return (
    <>
      <ModuleData currentTemp={currentTemp} targetTemp={targetTemp} />
      <TemperatureControls setTemp={setTargetTemp} />
    </>
  )
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: OP): DP {
  const { robot, module } = ownProps
  const { serial } = module

  return {
    setTargetTemp: request => dispatch(setTargetTemp(robot, serial, request)),
  }
}
