// @flow
// attached modules container card
import * as React from 'react'
import { connect } from 'react-redux'

import { Card, IntervalWrapper } from '@opentrons/components'
import { fetchModules, makeGetRobotModules } from '../../http-api-client'
import ModulesCardContents from './ModulesCardContents'
import { getConfig } from '../../config'

import type { State, Dispatch } from '../../types'
import type { Module } from '../../http-api-client'
import type { Robot } from '../../discovery'

type OP = {| robot: Robot |}

type SP = {|
  modules: ?Array<Module>,
  refreshing: boolean,
  __featureEnabled: boolean,
|}

type DP = {| refresh: () => mixed |}

type Props = { ...OP, ...SP, ...DP }

const TITLE = 'Modules'

export default connect<Props, OP, SP, DP, State, Dispatch>(
  makeMapStateToProps,
  mapDispatchToProps
)(AttachedModulesCard)

function AttachedModulesCard(props: Props) {
  return (
    <IntervalWrapper interval={2000} refresh={props.refresh}>
      <Card title={TITLE} column>
        <ModulesCardContents
          modules={props.modules}
          robot={props.robot}
          showControls={props.__featureEnabled}
        />
      </Card>
    </IntervalWrapper>
  )
}

function makeMapStateToProps(): (state: State, ownProps: OP) => SP {
  const getRobotModules = makeGetRobotModules()

  return (state, ownProps) => {
    const modulesCall = getRobotModules(state, ownProps.robot)
    const modulesResponse = modulesCall.response
    const modules = modulesResponse && modulesResponse.modules
    const devInternal = getConfig(state).devInternal
    return {
      modules: modules,
      refreshing: modulesCall.inProgress,
      __featureEnabled: !!devInternal && !!devInternal.tempdeckControls,
    }
  }
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: OP): DP {
  return {
    refresh: () => dispatch(fetchModules(ownProps.robot)),
  }
}
