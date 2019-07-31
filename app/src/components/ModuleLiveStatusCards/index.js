// @flow
import * as React from 'react'
import { connect } from 'react-redux'

import { getConnectedRobot } from '../../discovery'
import { fetchModules, getModulesState } from '../../robot-api'

import { IntervalWrapper } from '@opentrons/components'

import type { State, Dispatch } from '../../types'
import type { TempDeckModule } from '../../robot-api'
import type { Robot } from '../../discovery'

import TempDeckCard from './TempDeckCard'
import MagDeckCard from './MagDeckCard'
import ThermocyclerCard from './ThermocyclerCard'

const POLL_TEMPDECK_INTERVAL_MS = 1000
const LIVE_STATUS_MODULES = ['magdeck', 'tempdeck', 'thermocycler']

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
  const { liveStatusModules, fetchModules } = props
  if (liveStatusModules.length === 0) return null

  return (
    <IntervalWrapper
      refresh={fetchModules}
      interval={POLL_TEMPDECK_INTERVAL_MS}
    >
      {liveStatusModules.map(module => {
        switch (module.name) {
          case 'tempdeck':
            return <TempDeckCard key={module.serial} module={module} />
          case 'thermocycler':
            return <ThermocyclerCard key={module.serial} module={module} />
          case 'magdeck':
            return <MagDeckCard key={module.serial} module={module} />
          default:
            return null
        }
      })}
    </IntervalWrapper>
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
  }
}

function mapDispatchToProps(dispatch: Dispatch): DP {
  return {
    _fetchModules: _robot => dispatch(fetchModules(_robot)),
  }
}

function mergeProps(stateProps: SP, dispatchProps: DP): Props {
  const { _fetchModules } = dispatchProps
  const { _robot, liveStatusModules } = stateProps

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
