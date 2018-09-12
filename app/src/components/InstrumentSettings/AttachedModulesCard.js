// @flow
// attached modules container card
import * as React from 'react'
import {connect} from 'react-redux'

import type {State, Dispatch} from '../../types'
import type {Module} from '../../http-api-client'
import type {Robot} from '../../robot'

import {RefreshCard} from '@opentrons/components'
import {fetchModules, makeGetRobotModules} from '../../http-api-client'
import ModulesCardContents from './ModulesCardContents'

type OP = Robot

type SP = {
  modules: ?Array<Module>,
  refreshing: boolean,
}

type DP = {refresh: () => mixed}

type Props = OP & SP & DP

const TITLE = 'Modules'

export default connect(makeSTP, DTP)(AttachedModulesCard)

function AttachedModulesCard (props: Props) {
  return (
    <RefreshCard
      title={TITLE}
      watch={props.name}
      refreshing={props.refreshing}
      refresh={props.refresh}
      column
    >
      <ModulesCardContents modules={props.modules} />
    </RefreshCard>
  )
}

function makeSTP (): (state: State, ownProps: OP) => SP {
  const getRobotModules = makeGetRobotModules()

  return (state, ownProps) => {
    const modulesCall = getRobotModules(state, ownProps)
    const modulesResponse = modulesCall.response
    const modules = modulesResponse && modulesResponse.modules

    return {
      modules: modules,
      refreshing: modulesCall.inProgress,
    }
  }
}

function DTP (dispatch: Dispatch, ownProps: OP): DP {
  return {
    refresh: () => dispatch(fetchModules(ownProps)),
  }
}
