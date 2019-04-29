// @flow
import * as React from 'react'
import { connect } from 'react-redux'

import { getModuleDisplayName } from '@opentrons/shared-data'
import { getConnectedRobot } from '../../discovery'
import { fetchModules, fetchModuleData, getModulesState } from '../../robot-api'

import { LabeledValue, IntervalWrapper } from '@opentrons/components'
import StatusCard from './StatusCard'
import CardContentRow from './CardContentRow'
import StatusItem from './StatusItem'

import type { State, Dispatch } from '../../types'
import type { TempDeckModule } from '../../robot-api'
import type { Robot } from '../../discovery'

const POLL_TEMPDECK_INTERVAL_MS = 1000

type SP = {|
  _robot: ?Robot,
  tempDeck: TempDeckModule | null,
|}

type DP = {|
  _fetchModules: (_robot: Robot) => mixed,
  _fetchModuleData: (_robot: Robot, serial: string) => mixed,
|}

type Props = {|
  tempDeck: ?TempDeckModule,
  fetchModules: () => mixed,
  fetchModuleData: () => mixed,
|}

class TempDeckStatusCard extends React.Component<Props> {
  componentDidMount() {
    this.props.fetchModules()
  }

  render() {
    const { tempDeck, fetchModuleData } = this.props
    if (!tempDeck) return null

    const { name, status, data } = tempDeck
    const { currentTemp, targetTemp } = data
    const displayName = getModuleDisplayName(name)

    return (
      <IntervalWrapper
        refresh={fetchModuleData}
        // TODO: BC: 2018-08-13 we should really only be hitting fetchModuleData
        // again once we've received the response from the last call
        interval={POLL_TEMPDECK_INTERVAL_MS}
      >
        <StatusCard title={displayName}>
          <CardContentRow>
            <StatusItem status={status} />
          </CardContentRow>
          <CardContentRow>
            <LabeledValue label="Current Temp" value={`${currentTemp} °C`} />
            <LabeledValue
              label="Target Temp"
              value={targetTemp ? `${targetTemp} °C` : 'None'}
            />
          </CardContentRow>
        </StatusCard>
      </IntervalWrapper>
    )
  }
}

function mapStateToProps(state: State): SP {
  const _robot = getConnectedRobot(state)
  const modules = _robot ? getModulesState(state, _robot.name) : []

  // TOD0 (ka 2018-7-25): Only supporting 1 temp deck at a time at launch
  const tempDeck = modules.find(m => m.name === 'tempdeck')

  // bogus ternary to satisfy flow
  return {
    _robot,
    tempDeck: tempDeck && tempDeck.name === 'tempdeck' ? tempDeck : null,
  }
}

function mapDispatchToProps(dispatch: Dispatch): DP {
  return {
    _fetchModuleData: (_robot, _serial) =>
      dispatch(fetchModuleData(_robot, _serial)),
    _fetchModules: _robot => dispatch(fetchModules(_robot)),
  }
}

function mergeProps(stateProps: SP, dispatchProps: DP): Props {
  const { _fetchModules, _fetchModuleData } = dispatchProps
  const { _robot, tempDeck } = stateProps
  const _serial = tempDeck?.serial

  return {
    tempDeck,
    fetchModules: () => _robot && _fetchModules(_robot),
    fetchModuleData: () =>
      _robot && _serial && _fetchModuleData(_robot, _serial),
  }
}

export default connect<Props, {||}, SP, DP, State, Dispatch>(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(TempDeckStatusCard)
