// @flow
// attached pipettes container card
import * as React from 'react'
import { connect } from 'react-redux'

import { clearMoveResponse } from '../../http-api-client'

import {
  fetchPipetteSettings,
  getPipettesState,
  getPipetteSettingsState,
} from '../../robot-api'

import InstrumentInfo from './InstrumentInfo'
import { CardContentFlex } from '../layout'
import { Card, IntervalWrapper } from '@opentrons/components'

import type { State, Dispatch } from '../../types'
import type { Robot } from '../../discovery'
import type { Pipette } from '../../robot-api'

type OP = {|
  robot: Robot,
|}

type SP = {|
  left: Pipette | null,
  right: Pipette | null,
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
  mapStateToProps,
  mapDispatchToProps
)(AttachedPipettesCard)

function AttachedPipettesCard(props: Props) {
  return (
    <IntervalWrapper interval={5000} refresh={props.fetchPipettes}>
      <Card title={TITLE}>
        <CardContentFlex>
          <InstrumentInfo
            mount="left"
            robotName={props.robot.name}
            model={props.left?.model}
            onChangeClick={props.clearMove}
            showSettings={props.showLeftSettings}
          />
          <InstrumentInfo
            mount="right"
            robotName={props.robot.name}
            model={props.right?.model}
            onChangeClick={props.clearMove}
            showSettings={props.showRightSettings}
          />
        </CardContentFlex>
      </Card>
    </IntervalWrapper>
  )
}

function mapStateToProps(state: State, ownProps: OP): SP {
  const { robot } = ownProps
  const { left, right } = getPipettesState(state, robot.name)

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

function mapDispatchToProps(dispatch: Dispatch, ownProps: OP): DP {
  return {
    fetchPipettes: () => dispatch(fetchPipetteSettings(ownProps.robot)),
    clearMove: () => dispatch(clearMoveResponse(ownProps.robot)),
  }
}
