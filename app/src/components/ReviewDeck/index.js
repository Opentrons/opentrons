// @flow
// deck review modal for labware calibration page
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import some from 'lodash/some'
import { PrimaryButton, AlertModal } from '@opentrons/components'

import type { Dispatch } from '../../types'
import {
  actions as robotActions,
  selectors as robotSelectors,
} from '../../robot'

import { Portal } from '../portal'
import DeckMap from '../DeckMap'
import Prompt from './Prompt'
import styles from './styles.css'

type Props = {| slot: ?string |}

function ReviewDeck(props: Props) {
  const { slot } = props

  const dispatch = useDispatch<Dispatch>()
  const allLabware = useSelector(robotSelectors.getLabware)
  const calibratorMount = useSelector(robotSelectors.getCalibratorMount)
  const sessionModules = useSelector(robotSelectors.getModules)

  const [mustPrepNestedLabware, setMustPrepNestedLabware] = useState(
    some(sessionModules, mod => mod.name === 'thermocycler')
  )
  const [isPrepNestedLabwareOpen, setIsPrepNestedLabwareOpen] = useState(false)

  const currentLabware = allLabware.find(lw => lw.slot === slot)

  const continueToCalibrate = () => {
    if (currentLabware && calibratorMount) {
      const mountToUse = currentLabware.calibratorMount || calibratorMount
      dispatch(robotActions.moveTo(mountToUse, currentLabware.slot))
    }
  }
  const handleClick = () => {
    if (mustPrepNestedLabware) {
      setIsPrepNestedLabwareOpen(true)
    } else {
      continueToCalibrate()
    }
  }

  return (
    <div className={styles.page_content_dark}>
      {currentLabware && <Prompt {...currentLabware} onClick={handleClick} />}
      <div className={styles.deck_map_wrapper}>
        <DeckMap className={styles.deck_map} />
      </div>
      {isPrepNestedLabwareOpen && (
        <Portal>
          <AlertModal
            iconName={null}
            heading="Position latch to hold down plate"
          >
            <p>Push down the latch and lock in place to hold the PCR plate.</p>
            <p>
              This helps to ensure your PCR plate stays secure in place when the
              Thermocycler Module lid opens during a run.
            </p>
            <p>TODO IMAGE HERE</p>
            <PrimaryButton
              className={styles.open_lid_button}
              onClick={() => {
                setMustPrepNestedLabware(false)
                continueToCalibrate()
              }}
            >
              Confirm PCR Plate Is Latched Down
            </PrimaryButton>
          </AlertModal>
        </Portal>
      )}
    </div>
  )
}

export default ReviewDeck

// function mapStateToProps(state: State, ownProps: OP): SP {
//   // TODO(mc, 2018-02-05): getCurrentLabware selector
//   const labware = robotSelectors.getLabware(state)
//   const currentLabware = labware.find(lw => lw.slot === ownProps.slot)

//   return {
//     currentLabware,
//     _calibratorMount:
//       currentLabware &&
//       (currentLabware.calibratorMount ||
//         robotSelectors.getCalibratorMount(state)),
//   }
// }

// function mergeProps(stateProps: SP, dispatchProps: DP): Props {
//   const { currentLabware, _calibratorMount } = stateProps
//   const { dispatch } = dispatchProps

//   return {
//     ...stateProps,
//     confirmAndMoveTo: () =>
//       currentLabware &&
//       _calibratorMount &&
//       dispatch(robotActions.moveTo(_calibratorMount, currentLabware.slot)),
//   }
// }
