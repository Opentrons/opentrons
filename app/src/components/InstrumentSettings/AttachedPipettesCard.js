// @flow
// attached pipettes container card
import * as React from 'react'
import {connect} from 'react-redux'
import {getIn} from '@thi.ng/paths'

import {
  makeGetRobotPipettes,
  fetchPipettes,
  clearMoveResponse,
  fetchPipetteConfigs,
  makeGetRobotPipetteConfigs,
} from '../../http-api-client'
import {chainActions} from '../../util'

import InstrumentInfo from './InstrumentInfo'
import {CardContentFlex} from '../layout'
import {Card, IntervalWrapper} from '@opentrons/components'

import type {State} from '../../types'
import type {Robot} from '../../discovery'
import type {Pipette} from '../../http-api-client'
import {getConfig} from '../../config'

type OP = Robot

type SP = {
  inProgress: boolean,
  left: ?Pipette,
  right: ?Pipette,
  showSettings: boolean,
  __featureEnabled: boolean,
}

type DP = {
  fetchPipettes: () => mixed,
  clearMove: () => mixed,
}

type Props = OP & SP & DP

const __FEATURE_FLAG = 'devInternal.newPipetteConfig'

const TITLE = 'Pipettes'

export default connect(
  makeMapStateToProps,
  mapDispatchToProps
)(AttachedPipettesCard)

function AttachedPipettesCard (props: Props) {
  return (
    <IntervalWrapper interval={5000} refresh={props.fetchPipettes}>
      <Card title={TITLE}>
        <CardContentFlex>
          <InstrumentInfo
            mount="left"
            name={props.name}
            {...props.left}
            onChangeClick={props.clearMove}
            showSettings={props.showSettings}
            __enableConfig={props.__featureEnabled}
          />
          <InstrumentInfo
            mount="right"
            name={props.name}
            {...props.right}
            onChangeClick={props.clearMove}
            showSettings={props.showSettings}
            __enableConfig={props.__featureEnabled}
          />
        </CardContentFlex>
      </Card>
    </IntervalWrapper>
  )
}

function makeMapStateToProps (): (state: State, ownProps: OP) => SP {
  const getRobotPipettes = makeGetRobotPipettes()
  const getRobotPipetteConfigs = makeGetRobotPipetteConfigs()

  return (state, ownProps) => {
    const {inProgress, response} = getRobotPipettes(state, ownProps)
    const {left, right} = response || {left: null, right: null}
    const configCall = getRobotPipetteConfigs(state, ownProps)
    return {
      inProgress,
      left,
      right,
      showSettings: !!configCall.response,
      __featureEnabled: !!getIn(getConfig(state), __FEATURE_FLAG),
    }
  }
}

function mapDispatchToProps (dispatch: Dispatch, ownProps: OP): DP {
  return {
    fetchPipettes: () =>
      dispatch(
        chainActions(fetchPipettes(ownProps), fetchPipetteConfigs(ownProps))
      ),
    clearMove: () => dispatch(clearMoveResponse(ownProps)),
  }
}
