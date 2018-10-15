// @flow
// RobotSettings card for wifi status
import * as React from 'react'
import {connect} from 'react-redux'
import {getIn} from '@thi.ng/paths'

import {getConfig} from '../../config'

import type {State} from '../../types'
// import type {State, Dispatch} from '../../types'
import type {ViewableRobot} from '../../discovery'

import {RefreshCard} from '@opentrons/components'
import {ConnectionStatusMessage, WirelessInfo, WiredInfo} from './connection'

type OP = {robot: ViewableRobot}

type SP = {|__featureEnabled: boolean|}

// type DP = {||}

type Props = {...$Exact<OP>, ...SP}
// type Props = {...$Exact<OP>, ...SP, ...DP}

const __FEATURE_FLAG = 'devInternal.manageRobotConnection.newCard'

export default connect(
  makeMapStateToProps
  /* mapDispatchToProps */
)(ConnectionCard)

const TITLE = 'Connectivity'
function ConnectionCard (props: Props) {
  // TODO(mc, 2018-10-15): remove feature flag
  if (!props.__featureEnabled) return null

  // TODO(mc, 2018-10-15): implement
  return (
    <RefreshCard title={TITLE} refresh={() => console.log('placeholder')}>
      <ConnectionStatusMessage />
      <WirelessInfo />
      <WiredInfo />
    </RefreshCard>
  )
}

function makeMapStateToProps (): (State, OP) => SP {
  return (state, ownProps) => ({
    __featureEnabled: !!getIn(getConfig(state), __FEATURE_FLAG),
  })
}

// function mapDispatchToProps (dispatch: Dispatch, ownProps: OP): DP {
//   return {}
// }
