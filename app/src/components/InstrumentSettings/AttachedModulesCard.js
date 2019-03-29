// @flow
// attached modules container card
import * as React from 'react'
import {connect} from 'react-redux'

import {RefreshCard} from '@opentrons/components'
import {fetchModules, makeGetRobotModules} from '../../http-api-client'
import ModulesCardContents from './ModulesCardContents'
import {getConfig} from '../../config'

import type {State, Dispatch} from '../../types'
import type {Module} from '../../http-api-client'
import type {Robot} from '../../discovery'

type OP = Robot

type SP = {|
  modules: ?Array<Module>,
  refreshing: boolean,
  __featureEnabled: boolean,
|}

type DP = {|refresh: () => mixed|}

type Props = {...$Exact<OP>, ...SP, ...DP}

const TITLE = 'Modules'

export default connect(
  makeSTP,
  DTP
)(AttachedModulesCard)

function AttachedModulesCard (props: Props) {
  return (
    <RefreshCard
      title={TITLE}
      watch={props.name}
      refreshing={props.refreshing}
      refresh={props.refresh}
      column
    >
      <ModulesCardContents
        modules={props.modules}
        showThermo={props.__featureEnabled}
      />
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
      __featureEnabled: !!getConfig(state).devInternal?.enableThermocycler,
    }
  }
}

function DTP (dispatch: Dispatch, ownProps: OP): DP {
  return {
    refresh: () => dispatch(fetchModules(ownProps)),
  }
}
