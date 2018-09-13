// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import countBy from 'lodash/countBy'

import {makeGetRobotModules} from '../../http-api-client'
import {selectors as robotSelectors} from '../../robot'
import {Module as ModuleItem} from '@opentrons/components'

import type {LabwareComponentProps} from '@opentrons/components'
import type {State} from '../../types'
import type {SessionModule} from '../../robot'

type OP = LabwareComponentProps

type Props = {
  module: ?SessionModule,
  present: boolean,
}

export default connect(makeMapStateToProps)(ReviewModuleItem)

function ReviewModuleItem (props: Props) {
  if (!props.module) return null

  return (
    <ModuleItem name={props.module.name} mode={props.present ? 'present' : 'missing'} />
  )
}

function makeMapStateToProps (): (state: State, ownProps: OP) => Props {
  // TODO(mc, 2018-07-23): this logic is duplicated because can only get props
  // into Deck.props.LabwareComponent via redux
  const getRobotModules = makeGetRobotModules()

  return (state, ownProps) => {
    const robot = robotSelectors.getConnectedRobot(state)
    const module = robotSelectors.getModulesBySlot(state)[ownProps.slot]
    const sessionModules = robotSelectors.getModules(state)
    const actualModulesCall = robot && getRobotModules(state, robot)
    const actualModules =
      actualModulesCall &&
      actualModulesCall.response &&
      actualModulesCall.response.modules

    const requiredNames = countBy(sessionModules, 'name')
    const actualNames = countBy(actualModules || [], 'name')
    const present =
      !module || requiredNames[module.name] === actualNames[module.name]

    return {present, module}
  }
}
