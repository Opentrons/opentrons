// @flow
import * as React from 'react'
import { connect } from 'react-redux'

import { getMissingModules, fetchModules } from '../../modules'
import {
  selectors as robotSelectors,
  actions as robotActions,
} from '../../robot'

import { DeckMap } from '../DeckMap'
import { Prompt } from './Prompt'
import styles from './styles.css'

import type { State, Dispatch } from '../../types'

type OP = {| robotName: string |}

type SP = {| modulesRequired: boolean, modulesMissing: boolean |}

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

  const { modulesMissing, setReviewed, fetchModules } = props
  const onPromptClick = modulesMissing ? fetchModules : setReviewed

  return (
    <div className={styles.page_content_dark}>
      <Prompt modulesMissing={modulesMissing} onClick={onPromptClick} />
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
  }
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: OP): DP {
  return {
    setReviewed: () => dispatch(robotActions.setModulesReviewed(true)),
    fetchModules: () => dispatch(fetchModules(ownProps.robotName)),
  }
}
