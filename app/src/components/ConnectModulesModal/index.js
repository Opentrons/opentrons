// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import countBy from 'lodash/countBy'

import {makeGetRobotModules, fetchModules} from '../../http-api-client'
import {selectors as robotSelectors, actions as robotActions} from '../../robot'

import {Deck} from '@opentrons/components'
import {RefreshWrapper} from '../Page'
import {Modal} from '../modals'
import Prompt from './Prompt'
import ReviewModuleItem from './ReviewModuleItem'

import type {State} from '../../types'
import type {RobotService, SessionModule} from '../../robot'
import type {Module} from '../../http-api-client'

type OP = {
  robot: RobotService,
}

type SP = {
  modulesRequired: boolean,
  modulesMissing: boolean,
}

type DP = {
  setReviewed: () => mixed,
  fetchModules: () => mixed,
}

type Props = OP & SP & DP

export default connect(
  makeMapStateToProps,
  mapDispatchToProps
)(ConnectModulesModal)

function ConnectModulesModal (props: Props) {
  if (!props.modulesRequired) return null

  const {modulesMissing, setReviewed, fetchModules} = props
  const onPromptClick = modulesMissing ? fetchModules : setReviewed

  return (
    <RefreshWrapper refresh={fetchModules}>
      <Modal>
        <Prompt modulesMissing={modulesMissing} onClick={onPromptClick} />
        <Deck LabwareComponent={ReviewModuleItem} />
      </Modal>
    </RefreshWrapper>
  )
}

function makeMapStateToProps (): (state: State, ownProps: OP) => SP {
  const getRobotModules = makeGetRobotModules()

  return (state, ownProps) => {
    const sessionModules = robotSelectors.getModules(state)
    const actualModulesCall = getRobotModules(state, ownProps.robot)
    const actualModules =
      actualModulesCall.response && actualModulesCall.response.modules

    return {
      modulesRequired: sessionModules.length !== 0,
      modulesMissing: checkModulesMissing(sessionModules, actualModules),
    }
  }
}

function mapDispatchToProps (dispatch: Dispatch, ownProps: OP): DP {
  return {
    setReviewed: () => dispatch(robotActions.setModulesReviewed(true)),
    fetchModules: () => dispatch(fetchModules(ownProps.robot)),
  }
}

function checkModulesMissing (
  required: Array<SessionModule>,
  actual: ?Array<Module>
): boolean {
  const requiredNames = countBy(required, 'name')
  const actualNames = countBy(actual, 'name')

  return Object.keys(requiredNames).some(
    n => requiredNames[n] !== actualNames[n]
  )
}
