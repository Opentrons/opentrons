// @flow
// attached modules container card
import * as React from 'react'
import { connect } from 'react-redux'

import { Card } from '@opentrons/components'
import { getModulesState } from '../../robot-api'
import ModulesCardContents from './ModulesCardContents'
import { getConfig } from '../../config'

import type { State, Dispatch } from '../../types'
import type { Module } from '../../robot-api'
import type { Robot } from '../../discovery'

type OP = {| robot: Robot |}

type SP = {|
  modules: Array<Module>,
  __tempControlsEnabled: boolean,
|}

type Props = {| ...OP, ...SP, dispatch: Dispatch |}

const TITLE = 'Modules'

export default connect<Props, OP, SP, {||}, State, Dispatch>(mapStateToProps)(
  AttachedModulesCard
)

function AttachedModulesCard(props: Props) {
  return (
    <Card title={TITLE} column>
      <ModulesCardContents
        modules={props.modules}
        robot={props.robot}
        showControls={props.__tempControlsEnabled}
      />
    </Card>
  )
}

function mapStateToProps(state: State, ownProps: OP): SP {
  return {
    modules: getModulesState(state, ownProps.robot.name),
    __tempControlsEnabled: Boolean(
      getConfig(state).devInternal?.tempdeckControls
    ),
  }
}
