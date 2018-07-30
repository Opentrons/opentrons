// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import type {State} from '../../types'
import {
  selectors as robotSelectors,
  type Robot
} from '../../robot'
import type {TempDeckModule} from '../../http-api-client'
import {fetchModules, makeGetRobotModules} from '../../http-api-client'
import {LabeledValue, IntervalWrapper} from '@opentrons/components'
import StatusCard from './StatusCard'
import CardContentRow from './CardContentRow'
import StatusItem from './StatusItem'

type SP = {
  _robot: ?Robot,
  tempDeck: ?TempDeckModule
}

type DP = {dispatch: Dispatch}

type Props = SP & {
  fetchModules: () => mixed
}

export default connect(makeSTP, null, mergeProps)(TempDeckStatusCard)

function TempDeckStatusCard (props: Props) {
  const {tempDeck, fetchModules} = props

  if (!tempDeck) return null

  const STATUS = tempDeck.status
  const CURRENT = `${tempDeck.data.currentTemp} º C`
  const TARGET = `${tempDeck.data.targetTemp} º C`
  return (
    <IntervalWrapper
      refresh={fetchModules}
      interval={1000}
    >
        <StatusCard title={tempDeck.displayName}>
          <CardContentRow>
            <StatusItem status={STATUS} />
          </CardContentRow>
          <CardContentRow>
            <LabeledValue label='Current Temp' value={CURRENT} />
            <LabeledValue label='Target Temp' value={TARGET} />
          </CardContentRow>
        </StatusCard>
    </IntervalWrapper>
  )
}

function makeSTP (): (state: State) => SP {
  const getRobotModules = makeGetRobotModules()
  return (state) => {
    const _robot = robotSelectors.getConnectedRobot(state)
    const modulesCall = _robot && getRobotModules(state, _robot)
    const modulesResponse = modulesCall && modulesCall.response
    const modules = modulesResponse && modulesResponse.modules
    // TOD0 (ka 2018-7-25): Only supporting 1 temp deck at a time at launch
    const tempDeck = modules && ((modules.find(m => m.name === 'tempdeck'): any): TempDeckModule)
    return {
      _robot,
      tempDeck
    }
  }
}

function mergeProps (stateProps: SP, dispatchProps: DP): Props {
  const {dispatch} = dispatchProps
  const {_robot} = stateProps

  return {
    ...stateProps,
    fetchModules: () => _robot && dispatch(fetchModules(_robot))
  }
}
