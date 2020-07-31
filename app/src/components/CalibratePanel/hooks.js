// @flow
import { useSelector, useDispatch } from 'react-redux'
import { selectors as robotSelectors } from '../../robot'

export function useSetLabwareToCalibrate() {
  const dispatch = useDispatch<Dispatch>()
  const calibratorMount = useSelector(robotSelectors.getCalibratorMount)
  const deckPopulated = useSelector(robotSelectors.getDeckPopulated)
  React.useEffect(() => {
    robot && dispatch(fetchLabwareCalibrations(robot.name))
  }, [dispatch, robot])

  return (lw: Labware) => {
    const calibrator = lw.calibratorMount || calibratorMount
    if (!!deckPopulated && calibrator) {
      dispatch(robotActions.moveTo(calibrator, lw.slot))
    }
  }
}
