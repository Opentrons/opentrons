// @flow
// deck review modal for labware calibration page
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'

import type { State, Dispatch } from '../../types'
import {
  actions as robotActions,
  selectors as robotSelectors,
  type Mount,
  type Labware,
} from '../../robot'

import DeckMap from '../DeckMap'
import Prompt from './Prompt'
import styles from './styles.css'

type OP = {| slot: ?string |}

type SP = {| currentLabware: ?Labware, _calibratorMount: ?Mount |}

type DP = {| dispatch: Dispatch |}

type Props = { ...SP, onClick: () => void }

export default connect<Props, OP, SP, {||}, State, Dispatch>(
  mapStateToProps,
  null,
  mergeProps
)(ReviewDeck)

function ReviewDeck(props: Props) {
  const { slot } = props

  const dispatch = useDispatch<Dispatch>()
  const allLabware = useSelector(robotSelectors.getLabware)
  const calibratorMount = useSelector(robotSelectors.getCalibratorMount)

  const currentLabware = allLabware.find(lw => lw.slot === slot)

  const handleClick = () => {
    const prepareNestedLabware = true // TODO: get from elsewhere
    if (prepareNestedLabware) {
    } else if (currentLabware && calibratorMount) {
      const mountToUse = currentLabware.calibratorMount || calibratorMount
      dispatch(robotActions.moveTo(mountToUse, currentLabware.slot))
    }
  }

  return (
    <div className={styles.page_content_dark}>
      {currentLabware && <Prompt {...currentLabware} onClick={handleClick} />}
      <div className={styles.deck_map_wrapper}>
        <DeckMap className={styles.deck_map} />
      </div>
    </div>
  )
}

function mapStateToProps(state: State, ownProps: OP): SP {
  // TODO(mc, 2018-02-05): getCurrentLabware selector
  const labware = robotSelectors.getLabware(state)
  const currentLabware = labware.find(lw => lw.slot === ownProps.slot)

  return {
    currentLabware,
    _calibratorMount:
      currentLabware &&
      (currentLabware.calibratorMount ||
        robotSelectors.getCalibratorMount(state)),
  }
}

function mergeProps(stateProps: SP, dispatchProps: DP): Props {
  const { currentLabware, _calibratorMount } = stateProps
  const { dispatch } = dispatchProps

  return {
    ...stateProps,
    confirmAndMoveTo: () =>
      currentLabware &&
      _calibratorMount &&
      dispatch(robotActions.moveTo(_calibratorMount, currentLabware.slot)),
  }
}
