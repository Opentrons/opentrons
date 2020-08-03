// @flow
import { useSelector, useDispatch } from 'react-redux'
import {
  actions as robotActions,
  selectors as robotSelectors,
} from '../../robot'

import type { Labware } from '../../robot'
import type { Dispatch } from '../../types'

export function useSetLabwareToCalibrate(): Labware => void {
  const dispatch = useDispatch<Dispatch>()
  const calibratorMount = useSelector(robotSelectors.getCalibratorMount)
  const deckPopulated = useSelector(robotSelectors.getDeckPopulated)

  return (lw: Labware) => {
    const calibrator = lw.calibratorMount || calibratorMount
    if (!!deckPopulated && calibrator) {
      dispatch(robotActions.moveTo(calibrator, lw.slot))
    }
  }
}
