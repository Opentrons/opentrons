// @flow
// info panel for labware calibration page
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { push } from 'connected-react-router'

import {
  selectors as robotSelectors,
  actions as robotActions,
} from '../../robot'

import { PrimaryButton } from '@opentrons/components'
import styles from './styles.css'

import type { Mount, Labware } from '../../robot'
import type { Dispatch } from '../../types'

import { ProceedToRun } from './ProceedToRun'

export type InfoBoxButtonProps = {| labware: ?Labware |}

export function InfoBoxButton(props: InfoBoxButtonProps): React.Node {
  const { labware } = props
  const dispatch = useDispatch<Dispatch>()

  const nextLabware = useSelector(robotSelectors.getNextLabware)
  const robotCalibratorMount = useSelector(robotSelectors.getCalibratorMount)
  const nextLabwareTarget =
    !labware || labware.calibration === 'confirmed' ? nextLabware : null
  const buttonTarget = nextLabwareTarget || labware

  const buttonTargetIsNext =
    buttonTarget != null && buttonTarget === nextLabwareTarget
  const targetConfirmed = buttonTarget && buttonTarget.confirmed
  const mountToUse: ?Mount =
    (buttonTarget && buttonTarget.calibratorMount) || robotCalibratorMount

  if (!buttonTarget || (labware && labware.isMoving) || !mountToUse) return null

  if (buttonTargetIsNext || !targetConfirmed) {
    const type = robotSelectors.labwareType(buttonTarget)
    return (
      <PrimaryButton
        className={styles.info_box_button}
        onClick={() => {
          dispatch(robotActions.moveTo(mountToUse, buttonTarget.slot))
          dispatch(push(`/calibrate/labware/${buttonTarget.slot}`))
        }}
      >
        {buttonTargetIsNext ? `Move to next ${type}` : `Move to ${type}`}
      </PrimaryButton>
    )
  } else {
    return (
      <ProceedToRun
        returnTip={() => {
          dispatch(robotActions.returnTip(mountToUse))
        }}
      />
    )
  }
}
