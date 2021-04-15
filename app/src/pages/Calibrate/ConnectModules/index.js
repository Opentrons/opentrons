// @flow
import * as React from 'react'
import { connect } from 'react-redux'

import { getMissingModules, fetchModules } from '../../../redux/modules'
import {
  selectors as robotSelectors,
  actions as robotActions,
} from '../../../redux/robot'

import { DeckMap } from '../../../molecules/DeckMap'
import { Prompt } from './Prompt'
import styles from './styles.css'

import type { State, Dispatch } from '../../../redux/types'

type OP = {| robotName: string |}

type SP = {|
  modulesRequired: boolean,
  modulesMissing: boolean,
  hasDuplicateModules: boolean,
|}

type DP = {| setReviewed: () => mixed, fetchModules: () => mixed |}

type Props = {| ...OP, ...SP, ...DP |}

export const ConnectModules: React.AbstractComponent<OP> = connect<
  Props,
  OP,
  SP,
  DP,
  State,
  Dispatch
>(
  mapStateToProps,
  mapDispatchToProps
)(ConnectModulesComponent)

function ConnectModulesComponent(props: Props) {
  if (!props.modulesRequired) return null

  const {
    modulesMissing,
    setReviewed,
    fetchModules,
    hasDuplicateModules,
  } = props

  if (modulesMissing) {
    fetchModules()
  }
  return (
    <div className={styles.page_content_dark}>
      <Prompt
        onPromptClick={setReviewed}
        modulesMissing={modulesMissing}
        hasDuplicateModules={hasDuplicateModules}
      />
      <div className={styles.deck_map_wrapper}>
        <DeckMap className={styles.deck_map} modulesRequired />
      </div>
    </div>
  )
}

function mapStateToProps(state: State, ownProps: OP): SP {
  return {
    modulesRequired: robotSelectors.getModules(state).length > 0,
    modulesMissing: getMissingModules(state).length > 0,
    hasDuplicateModules: Object.values(
      robotSelectors.getModulesByModel(state)
    ).some(m => Array.isArray(m) && m.length > 1),
  }
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: OP): DP {
  return {
    setReviewed: () => dispatch(robotActions.setModulesReviewed(true)),
    fetchModules: () => dispatch(fetchModules(ownProps.robotName)),
  }
}
