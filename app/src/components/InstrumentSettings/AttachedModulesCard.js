// @flow
// attached modules container card
import * as React from 'react'
import { connect } from 'react-redux'

import { Card, IntervalWrapper } from '@opentrons/components'
import { fetchModules, getModulesState } from '../../robot-api'
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

type DP = {| fetchModules: () => mixed |}

type Props = { ...OP, ...SP, ...DP }

const TITLE = 'Modules'
const POLL_MODULE_INTERVAL_MS = 5000

export default connect<Props, OP, SP, DP, State, Dispatch>(
  mapStateToProps,
  mapDispatchToProps
)(AttachedModulesCard)

function AttachedModulesCard(props: Props) {
  return (
    <IntervalWrapper
      interval={POLL_MODULE_INTERVAL_MS}
      refresh={props.fetchModules}
    >
      <Card title={TITLE} column>
        <ModulesCardContents
          modules={props.modules}
          robot={props.robot}
          showControls={props.__tempControlsEnabled}
        />
      </Card>
    </IntervalWrapper>
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

function mapDispatchToProps(dispatch: Dispatch, ownProps: OP): DP {
  return {
    fetchModules: () => dispatch(fetchModules(ownProps.robot)),
  }
}
