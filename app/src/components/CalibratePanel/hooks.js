// @flow
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  actions as robotActions,
  selectors as robotSelectors,
} from '../../robot'
import { getConnectedRobot } from '../../discovery'

import type { Labware } from '../../robot'
import type { Dispatch } from '../../types'

export function useSetLabwareToCalibrate(): Labware => void {
  const dispatch = useDispatch<Dispatch>()
  const robot = useSelector(getConnectedRobot)
  const calibratorMount = useSelector(robotSelectors.getCalibratorMount)
  const deckPopulated = useSelector(robotSelectors.getDeckPopulated)

  return (lw: Labware) => {
    const calibrator = lw.calibratorMount || calibratorMount
    if (!!deckPopulated && calibrator) {
      dispatch(robotActions.moveTo(calibrator, lw.slot))
    }
  }
}
