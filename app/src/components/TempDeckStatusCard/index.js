// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import type {State} from '../../types'
import {
  selectors as robotSelectors
} from '../../robot'
import type {TempDeckModule} from '../../http-api-client'
import {makeGetRobotModules} from '../../http-api-client'
import {LabeledValue} from '@opentrons/components'
import StatusCard from './StatusCard'
import CardContentRow from './CardContentRow'
import StatusItem from './StatusItem'

type SP = {
  tempDeck: ?TempDeckModule
}

type Props = SP

export default connect(makeSTP, null)(TempdeckStatusCard)

function TempdeckStatusCard (props: Props) {
  const {tempDeck} = props

  if (!tempDeck) return null

  const STATUS = tempDeck.status
  const CURRENT = `${tempDeck.data.currentTemp} º C`
  const TARGET = `${tempDeck.data.targetTemp} º C`
  return (
    <React.Fragment>
        <StatusCard title={tempDeck.displayName}>
          <CardContentRow>
            <StatusItem status={STATUS} />
          </CardContentRow>
          <CardContentRow>
            <LabeledValue label='Current Temp' value={CURRENT} />
            <LabeledValue label='Current Temp' value={TARGET} />
          </CardContentRow>
        </StatusCard>
    </React.Fragment>
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
      tempDeck
    }
  }
}
