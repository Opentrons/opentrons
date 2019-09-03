// @flow
import * as React from 'react'
import { connect } from 'react-redux'

import { getMissingModules, fetchModules } from '../../robot-api'
import {
  selectors as robotSelectors,
  actions as robotActions,
} from '../../robot'

import { RefreshWrapper } from '../Page'
import DeckMap from '../DeckMap'
import Prompt from './Prompt'
import styles from './styles.css'

import type { State, Dispatch } from '../../types'
import type { RobotService } from '../../robot/types'

type OP = {| robot: RobotService |}

type SP = {| modulesRequired: boolean, modulesMissing: boolean |}

type DP = {| setReviewed: () => mixed, fetchModules: () => mixed |}

type Props = {| ...OP, ...SP, ...DP |}

export default connect<Props, OP, SP, DP, State, Dispatch>(
  mapStateToProps,
  mapDispatchToProps
)(ConnectModules)

function ConnectModules(props: Props) {
  if (!props.modulesRequired) return null

  const { modulesMissing, setReviewed, fetchModules } = props
  const onPromptClick = modulesMissing ? fetchModules : setReviewed

  return (
    <RefreshWrapper refresh={fetchModules}>
      <div className={styles.page_content_dark}>
        <Prompt modulesMissing={modulesMissing} onClick={onPromptClick} />
        <div className={styles.deck_map_wrapper}>
          <DeckMap className={styles.deck_map} modulesRequired />
        </div>
      </div>
    </RefreshWrapper>
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
    fetchModules: () => dispatch(fetchModules(ownProps.robot)),
  }
}
