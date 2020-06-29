// @flow
import { PrimaryButton } from '@opentrons/components'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { actions as robotActions } from '../../robot'
import { getDeckPopulated } from '../../robot/selectors'
import type { Dispatch } from '../../types'
import { CalibrationInfoContent } from '../CalibrationInfoContent'
import { ClearDeckAlertModal } from '../ClearDeckAlertModal'
import type { TipProbeProps } from './types'

export function UnprobedPanel(props: TipProbeProps): React.Node {
  const { mount, probed } = props
  const [showClearDeck, setShowClearDeck] = React.useState(false)
  const dispatch = useDispatch<Dispatch>()
  const deckPopulated = useSelector(getDeckPopulated)

  const moveToFront = () => {
    dispatch(robotActions.moveToFront(mount))
    setShowClearDeck(false)
  }

  const handleStart = () => {
    if (deckPopulated === true || deckPopulated === null) {
      setShowClearDeck(true)
    } else {
      moveToFront()
    }
  }

  const message = !probed
    ? 'Pipette tip is not calibrated'
    : 'Pipette tip is calibrated'

  const buttonText = !probed ? 'Calibrate Tip' : 'Recalibrate Tip'

  const leftChildren = (
    <div>
      <p>{message}</p>
      <PrimaryButton onClick={handleStart}>{buttonText}</PrimaryButton>
    </div>
  )

  return (
    <>
      <CalibrationInfoContent leftChildren={leftChildren} />
      {showClearDeck && (
        <ClearDeckAlertModal
          continueText={'Move pipette to front'}
          cancelText={'Cancel'}
          onContinueClick={moveToFront}
          onCancelClick={() => setShowClearDeck(false)}
          removeTrash
        />
      )}
    </>
  )
}
