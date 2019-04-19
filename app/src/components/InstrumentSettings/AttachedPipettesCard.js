// @flow
// attached pipettes container card
import * as React from 'react'
import { connect } from 'react-redux'

import {
  makeGetRobotPipettes,
  fetchPipettes,
  clearMoveResponse,
  fetchPipetteConfigs,
  makeGetRobotPipetteConfigs,
} from '../../http-api-client'
import { chainActions } from '../../util'

import InstrumentInfo from './InstrumentInfo'
import { CardContentFlex } from '../layout'
import { Card, IntervalWrapper } from '@opentrons/components'

import type { State, Dispatch } from '../../types'
import type { Robot } from '../../discovery'
import type { Pipette } from '../../http-api-client'

type OP = {|
  robot: Robot,
|}

type SP = {|
  inProgress: boolean,
  left: ?Pipette,
  right: ?Pipette,
  showSettings: boolean,
|}

type DP = {|
  fetchPipettes: () => mixed,
  clearMove: () => mixed,
|}

type Props = { ...OP, ...SP, ...DP }

const TITLE = 'Pipettes'

export default connect<Props, OP, SP, _, _, _>(
  makeMapStateToProps,
  mapDispatchToProps
)(AttachedPipettesCard)

function AttachedPipettesCard(props: Props) {
  return (
    <IntervalWrapper interval={5000} refresh={props.fetchPipettes}>
      <Card title={TITLE}>
        <CardContentFlex>
          <InstrumentInfo
            mount="left"
            name={props.robot.name}
            {...props.left}
            onChangeClick={props.clearMove}
            showSettings={props.showSettings}
          />
          <InstrumentInfo
            mount="right"
            name={props.robot.name}
            {...props.right}
            onChangeClick={props.clearMove}
            showSettings={props.showSettings}
          />
        </CardContentFlex>
      </Card>
    </IntervalWrapper>
  )
}

function makeMapStateToProps(): (state: State, ownProps: OP) => SP {
  const getRobotPipettes = makeGetRobotPipettes()
  const getRobotPipetteConfigs = makeGetRobotPipetteConfigs()

  return (state, ownProps) => {
    const { inProgress, response } = getRobotPipettes(state, ownProps.robot)
    const { left, right } = response || { left: null, right: null }
    const configCall = getRobotPipetteConfigs(state, ownProps.robot)
    return {
      inProgress,
      left,
      right,
      showSettings: !!configCall.response,
    }
  }
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: OP): DP {
  return {
    fetchPipettes: () =>
      dispatch(
        chainActions(
          fetchPipettes(ownProps.robot),
          fetchPipetteConfigs(ownProps.robot)
        )
      ),
    clearMove: () => dispatch(clearMoveResponse(ownProps.robot)),
  }
}
