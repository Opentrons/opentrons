// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import countBy from 'lodash/countBy'

import { getModulesState } from '../../robot-api'
import { getConnectedRobot } from '../../discovery'
import { selectors as robotSelectors } from '../../robot'
import { Module as ModuleItem } from '@opentrons/components'

import type { LabwareComponentProps } from '@opentrons/components'
import type { State } from '../../types'
import type { SessionModule } from '../../robot'

type OP = $Exact<LabwareComponentProps>

type SP = {| module: ?SessionModule, present: boolean |}

type Props = { ...OP, ...SP }

export default connect<Props, OP, SP, _, _, _>(mapStateToProps)(
  ReviewModuleItem
)

function ReviewModuleItem(props: Props) {
  if (!props.module) return null

  return (
    <ModuleItem
      name={props.module.name}
      mode={props.present ? 'present' : 'missing'}
    />
  )
}

function mapStateToProps(state: State, ownProps: OP): SP {
  // TODO(mc, 2018-07-23): this logic is duplicated because can only get props
  // into Deck.props.LabwareComponent via redux
  const robot = getConnectedRobot(state)
  const module = robotSelectors.getModulesBySlot(state)[ownProps.slot]
  const sessionModules = robotSelectors.getModules(state)
  const actualModules = robot ? getModulesState(state, robot.name) : []

  const requiredNames = countBy(sessionModules, 'name')
  const actualNames = countBy(actualModules, 'name')
  const present =
    !module || requiredNames[module.name] === actualNames[module.name]

  return { present, module }
}
