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

import type { MapDispatchToProps } from 'react-redux'
import type { State } from '../../../redux/types'

interface OP {
  robotName: string
}

interface SP {
  modulesRequired: boolean
  modulesMissing: boolean
  hasDuplicateModules: boolean
}

interface DP {
  setReviewed: () => unknown
  fetchModules: () => unknown
}

type Props = OP & SP & DP

function ConnectModulesComponent(props: Props): JSX.Element | null {
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

const mapDispatchToProps: MapDispatchToProps<DP, OP> = (dispatch, ownProps) => {
  return {
    setReviewed: () => dispatch(robotActions.setModulesReviewed(true)),
    fetchModules: () => dispatch(fetchModules(ownProps.robotName)),
  }
}

export const ConnectModules = connect(
  mapStateToProps,
  mapDispatchToProps
)(ConnectModulesComponent)
