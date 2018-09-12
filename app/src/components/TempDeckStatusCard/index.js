// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import type {State} from '../../types'
import {
  selectors as robotSelectors,
  type Robot,
} from '../../robot'
import type {TempDeckModule, FetchModuleDataResponse} from '../../http-api-client'
import {fetchModules, fetchModuleData, makeGetRobotModules, makeGetRobotModuleData} from '../../http-api-client'
import {LabeledValue, IntervalWrapper} from '@opentrons/components'
import StatusCard from './StatusCard'
import CardContentRow from './CardContentRow'
import StatusItem from './StatusItem'

const POLL_TEMPDECK_INTERVAL_MS = 1000

type SP = {
  _robot: ?Robot,
  tempdeck: ?TempDeckModule,
  tempdeckData: ?FetchModuleDataResponse,
}

type DP = {
  _fetchModules: (_robot: Robot) => mixed,
  _fetchModuleData: (_robot: Robot, serial: string) => mixed,
}

type Props = {
  tempdeck: ?TempDeckModule,
  tempdeckData: ?FetchModuleDataResponse,
  fetchModules: () => mixed,
  fetchModuleData: () => mixed,
}

class TempDeckStatusCard extends React.Component<Props> {
  componentDidMount () {
    this.props.fetchModules()
  }

  render () {
    const {tempdeck, tempdeckData, fetchModuleData} = this.props

    if (!tempdeck) return null

    // TODO: BC: 2018-08-13 we should really only be hitting fetchModuleData
    // again once we've received the response from the last call
    const currentTemp = (tempdeckData && tempdeckData.data.currentTemp) || tempdeck.data.currentTemp
    const targetTemp = (tempdeckData && tempdeckData.data.targetTemp) || tempdeck.data.targetTemp
    return (
      <IntervalWrapper refresh={fetchModuleData} interval={POLL_TEMPDECK_INTERVAL_MS}>
          <StatusCard title={tempdeck.displayName}>
            <CardContentRow>
              <StatusItem status={(tempdeckData && tempdeckData.status) || tempdeck.status } />
            </CardContentRow>
            <CardContentRow>
              <LabeledValue
                label='Current Temp'
                value={`${currentTemp} °C`} />
              <LabeledValue
                label='Target Temp'
                value={targetTemp ? `${targetTemp} °C` : 'None'} />
            </CardContentRow>
          </StatusCard>
      </IntervalWrapper>
    )
  }
}

function makeSTP (): (state: State) => SP {
  const getRobotModules = makeGetRobotModules()
  const getRobotModuleData = makeGetRobotModuleData()
  return (state) => {
    const _robot = robotSelectors.getConnectedRobot(state)
    const modulesCall = _robot && getRobotModules(state, _robot)
    const modulesResponse = modulesCall && modulesCall.response
    const modules = modulesResponse && modulesResponse.modules
    // TOD0 (ka 2018-7-25): Only supporting 1 temp deck at a time at launch
    const tempdeck = modules && ((modules.find(m => m.name === 'tempdeck'): any): TempDeckModule)
    const _serial = tempdeck && tempdeck.serial
    const tempdeckDataCall = _robot && getRobotModuleData(state, _robot, _serial)
    const tempdeckData = tempdeckDataCall && tempdeckDataCall.response
    return {
      _robot,
      tempdeck,
      tempdeckData,
    }
  }
}

function mapDTP (dispatch: Dispatch): DP {
  return {
    _fetchModuleData: (_robot, _serial) => dispatch(fetchModuleData(_robot, _serial)),
    _fetchModules: (_robot) => dispatch(fetchModules(_robot)),
  }
}

function mergeProps (stateProps: SP, dispatchProps: DP): Props {
  const {_fetchModules, _fetchModuleData} = dispatchProps
  const {_robot, tempdeck, tempdeckData} = stateProps
  const _serial = tempdeck && tempdeck.serial

  return {
    tempdeck,
    tempdeckData,
    fetchModules: () => _robot && _fetchModules(_robot),
    fetchModuleData: () => _robot && _serial && _fetchModuleData(_robot, _serial),
  }
}

export default connect(makeSTP, mapDTP, mergeProps)(TempDeckStatusCard)
