// @flow
// attached pipettes container card
import * as React from 'react'
import { connect } from 'react-redux'

import {
  makeGetRobotPipettes,
  fetchPipettes,
  clearMoveResponse,
} from '../../http-api-client'

import { fetchPipetteSettings, getPipetteSettingsState } from '../../robot-api'

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
  left: ?Pipette,
  right: ?Pipette,
  showLeftSettings: boolean,
  showRightSettings: boolean,
|}

type DP = {|
  fetchPipettes: () => mixed,
  clearMove: () => mixed,
|}

type Props = {| ...OP, ...SP, ...DP |}

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
            showSettings={props.showLeftSettings}
          />
          <InstrumentInfo
            mount="right"
            name={props.robot.name}
            {...props.right}
            onChangeClick={props.clearMove}
            showSettings={props.showRightSettings}
          />
        </CardContentFlex>
      </Card>
    </IntervalWrapper>
  )
}

function makeMapStateToProps(): (state: State, ownProps: OP) => SP {
  const getRobotPipettes = makeGetRobotPipettes()

  return (state, ownProps) => {
    const { robot } = ownProps
    const { response } = getRobotPipettes(state, robot)
    const { left, right } = response || { left: null, right: null }
    const showLeftSettings =
      left && left.id
        ? Boolean(getPipetteSettingsState(state, robot.name, left.id))
        : false

    const showRightSettings =
      right && right.id
        ? Boolean(getPipetteSettingsState(state, robot.name, right.id))
        : false

    return {
      left,
      right,
      showLeftSettings,
      showRightSettings,
    }
  }
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: OP): DP {
  return {
    fetchPipettes: () =>
      dispatch(
        chainActions(
          fetchPipettes(ownProps.robot),
          fetchPipetteSettings(ownProps.robot)
        )
      ),
    clearMove: () => dispatch(clearMoveResponse(ownProps.robot)),
  }
}
