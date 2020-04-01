// @flow
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ModalPage } from '@opentrons/components'
import type { State, Dispatch } from '../../types'
import {
  createRobotCalibrationCheckSession,
  deleteRobotCalibrationCheckSession,
  getRobotCalibrationCheckSession,
} from '../../calibration'
import { createLogger } from '../../logger'

import { CompleteConfirmation } from './CompleteConfirmation'
import styles from './styles.css'

const log = createLogger(__filename)

const ROBOT_CALIBRATION_CHECK_SUBTITLE = 'Check deck calibration'

type CheckCalibrationProps = {|
  robotName: string,
  closeCalibrationCheck: () => mixed,
|}
export function CheckCalibration(props: CheckCalibrationProps) {
  const { robotName, closeCalibrationCheck } = props
  const dispatch = useDispatch<Dispatch>()
  const { currentStep, nextSteps } = useSelector((state: State) =>
    getRobotCalibrationCheckSession(state, robotName)
  ) || {}
  React.useEffect(() => {
    dispatch(createRobotCalibrationCheckSession(robotName))
  }, [dispatch, robotName])

  function exit() {
    dispatch(deleteRobotCalibrationCheckSession(robotName))
    closeCalibrationCheck()
  }

  return (
    currentStep && (
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
  )
}
