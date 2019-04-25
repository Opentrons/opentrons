// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { IntervalWrapper } from '@opentrons/components'
import ModuleData from './ModuleData'
import TemperatureControls from './TemperatureControls'

import {
  makeGetRobotModuleData,
  fetchModuleData,
  setTargetTemp,
} from '../../http-api-client'
import type { State, Dispatch } from '../../types'

import type {
  Module,
  FetchTemperatureDataResponse,
  SetTemperatureRequest,
} from '../../http-api-client'
import type { Robot } from '../../discovery'

const POLL_MODULE_INTERVAL_MS = 2000

type OP = {|
  robot: Robot,
  module: Module,
|}

type SP = {|
  moduleData: ?FetchTemperatureDataResponse,
|}

type DP = {|
  fetchModuleData: () => mixed,
  setTargetTemp: (request: SetTemperatureRequest) => mixed,
|}

type Props = { ...OP, ...SP, ...DP }

export default connect<Props, OP, SP, DP, State, Dispatch>(
  makeSTP,
  mapDTP
)(ModuleControls)

function ModuleControls(props: Props) {
  const { moduleData, fetchModuleData } = props

  const currentTemp =
    moduleData && moduleData.data && moduleData.data.currentTemp
  const targetTemp = moduleData && moduleData.data && moduleData.data.targetTemp

  return (
    <IntervalWrapper
      refresh={fetchModuleData}
      interval={POLL_MODULE_INTERVAL_MS}
    >
      <ModuleData currentTemp={currentTemp} targetTemp={targetTemp} />

      <TemperatureControls setTemp={props.setTargetTemp} />
    </IntervalWrapper>
  )
}

function makeSTP(): (state: State, ownProps: OP) => SP {
  const getRobotModuleData = makeGetRobotModuleData()
  return (state, ownProps) => {
    const _serial = ownProps.module.serial
    const _robot = ownProps.robot
    const moduleDataCall = _robot && getRobotModuleData(state, _robot, _serial)
    const moduleData = moduleDataCall && moduleDataCall.response
    return {
      moduleData,
    }
  }
}

function mapDTP(dispatch: Dispatch, ownProps: OP): DP {
  const { robot } = ownProps
  const serial = ownProps.module.serial
  return {
    fetchModuleData: () => dispatch(fetchModuleData(robot, serial)),
    setTargetTemp: request => dispatch(setTargetTemp(robot, serial, request)),
  }
}
