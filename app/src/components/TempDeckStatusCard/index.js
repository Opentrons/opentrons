// @flow
import * as React from 'react'
import { connect } from 'react-redux'

import { getModuleDisplayName } from '@opentrons/shared-data'
import { getConnectedRobot } from '../../discovery'
import { fetchModules, getModulesState } from '../../robot-api'

import { LabeledValue, IntervalWrapper } from '@opentrons/components'
import StatusCard from './StatusCard'
import CardContentRow from './CardContentRow'
import StatusItem from './StatusItem'

import type { State, Dispatch } from '../../types'
import type { TempDeckModule } from '../../robot-api'
import type { Robot } from '../../discovery'

import TempDeckCard from './TempDeckCard'
import ThermocyclerCard from './ThermocyclerCard'

const POLL_TEMPDECK_INTERVAL_MS = 1000
const LIVE_STATUS_MODULES = ['tempdeck', 'thermocycler']

type SP = {|
  _robot: ?Robot,
  liveStatusModules: Array<TempDeckModule | ThermocyclerModule>,
|}

type DP = {|
  _fetchModules: (_robot: Robot) => mixed,
|}

type Props = {|
  liveStatusModules: Array<TempDeckModule | ThermocyclerModule>,
  fetchModules: () => mixed,
|}

const ModuleLiveStatusCards = (props: Props) => {
    const { liveStatusModules } = this.props
    if (liveStatusModules.length === 0) return null

    const { name, status, data } = tempDeck
    const { currentTemp, targetTemp } = data
    const displayName = getModuleDisplayName(name)

    return (
      <IntervalWrapper
        refresh={fetchModules}
        interval={POLL_TEMPDECK_INTERVAL_MS}
      >
        {liveStatusModules.map(module => {
          switch (module.name) {
            case 'tempdeck':
              return <TempDeckCard module={module} />
            case 'thermocycler':
              return <ThermocyclerCard module={module} />
            case 'magdeck':
            default:
              return null
          }
        })}
      </IntervalWrapper>
    )
  }
}

function mapStateToProps(state: State): SP {
  const _robot = getConnectedRobot(state)
  const modules = _robot ? getModulesState(state, _robot.name) : []

  // TOD0 (ka 2018-7-25): Only supporting 1 temp deck at a time at launch
  const liveStatusModules = modules.filter(m =>
    LIVE_STATUS_MODULES.includes(m.name)
  )

  // bogus ternary to satisfy flow
  return {
    _robot,
    liveStatusModules,
  }
}

function mapDispatchToProps(dispatch: Dispatch): DP {
  return {
    _fetchModules: _robot => dispatch(fetchModules(_robot)),
  }
}

function mergeProps(stateProps: SP, dispatchProps: DP): Props {
  const { _fetchModules } = dispatchProps
  const { _robot, liveStatusModules} = stateProps

  return {
    liveStatusModules,
    fetchModules: () => _robot && _fetchModules(_robot),
  }
}

export default connect<Props, {||}, SP, DP, State, Dispatch>(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(ModuleLiveStatusCards)
