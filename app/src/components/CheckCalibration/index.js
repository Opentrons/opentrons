// @flow
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ModalPage } from '@opentrons/components'
import type { State, Dispatch } from '../../types'
import {
  fetchRobotCalibrationCheckSession,
  endRobotCalibrationCheckSession,
  getRobotCalibrationCheckSession,
} from '../../calibration'
import { useLogger } from '../../logger'

import { CompleteConfirmation } from './CompleteConfirmation'
import styles from './styles.css'

const ROBOT_CALIBRATION_CHECK_SUBTITLE = 'Check deck calibration'

type CheckCalibrationProps = {|
  robotName: string,
  closeCalibrationCheck: () => mixed,
|}
export function CheckCalibration(props: CheckCalibrationProps) {
  const { robotName, closeCalibrationCheck } = props
  const dispatch = useDispatch<Dispatch>()
  const robotCalibrationCheckSessionData = useSelector((state: State) =>
    getRobotCalibrationCheckSession(state, robotName)
  )
  React.useEffect(() => {
    dispatch(fetchRobotCalibrationCheckSession(robotName))
  }, [dispatch, robotName])
  const log = useLogger(__dirname)

  function exit() {
    dispatch(endRobotCalibrationCheckSession(robotName))
    closeCalibrationCheck()
  }

  log.debug('robot calibration check session data: ', robotCalibrationCheckSessionData || {})
  return (
    <ModalPage
      titleBar={{
        title: ROBOT_CALIBRATION_CHECK_SUBTITLE,
        back: { onClick: exit },
      }}
      contentsClassName={styles.modal_contents}
    >
      <CompleteConfirmation robotName={robotName} exit={exit} />
    </ModalPage>
  )
}
