// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import countBy from 'lodash/countBy'

import { getModulesState, fetchModules } from '../../robot-api'
import {
  selectors as robotSelectors,
  actions as robotActions,
} from '../../robot'

// import { Deck } from '@opentrons/components'
import { RefreshWrapper } from '../Page'
import DeckMap from '../DeckMap'
import { Modal } from '../modals'
import Prompt from './Prompt'
import ReviewModuleItem from './ReviewModuleItem'
import styles from './styles.css'

import type { State, Dispatch } from '../../types'
import type { RobotService, SessionModule } from '../../robot'
import type { Module } from '../../robot-api'

type OP = {| robot: RobotService |}

type SP = {| modulesRequired: boolean, modulesMissing: boolean |}

type DP = {| setReviewed: () => mixed, fetchModules: () => mixed |}

type Props = { ...OP, ...SP, ...DP }

export default connect<Props, OP, SP, DP, State, Dispatch>(
  mapStateToProps,
  mapDispatchToProps
)(ConnectModulesModal)

function ConnectModulesModal(props: Props) {
  if (!props.modulesRequired) return null

  const { modulesMissing, setReviewed, fetchModules } = props
  const onPromptClick = modulesMissing ? fetchModules : setReviewed

  return (
    <RefreshWrapper refresh={fetchModules}>
      <div className={styles.page_content_dark}>
        <Prompt modulesMissing={modulesMissing} onClick={onPromptClick} />
        {/* <Deck LabwareComponent={ReviewModuleItem} /> */}
        <DeckMap modulesRequired />
      </div>
    </RefreshWrapper>
  )
}

function mapStateToProps(state: State, ownProps: OP): SP {
  const sessionModules = robotSelectors.getModules(state)
  const actualModules = getModulesState(state, ownProps.robot.name)

  return {
    modulesRequired: sessionModules.length !== 0,
    modulesMissing: checkModulesMissing(sessionModules, actualModules),
  }
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: OP): DP {
  return {
    setReviewed: () => dispatch(robotActions.setModulesReviewed(true)),
    fetchModules: () => dispatch(fetchModules(ownProps.robot)),
  }
}

function checkModulesMissing(
  required: Array<SessionModule>,
  actual: ?Array<Module>
): boolean {
  const requiredNames = countBy(required, 'name')
  const actualNames = countBy(actual, 'name')

  return Object.keys(requiredNames).some(
    n => requiredNames[n] !== actualNames[n]
  )
}
