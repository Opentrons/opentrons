// @flow
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ModalPage } from '@opentrons/components'
import type { State, Dispatch } from '../../types'
import {
  createRobotCalibrationCheckSession,
  deleteRobotCalibrationCheckSession,
  getRobotCalibrationCheckSession,
  ROBOT_CALIBRATION_CHECK_STEPS,
} from '../../calibration'
import { createLogger } from '../../logger'

import { Introduction } from './Introduction'
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
  const { currentStep, nextSteps, labware } =
    useSelector((state: State) =>
      getRobotCalibrationCheckSession(state, robotName)
    ) || {}
  React.useEffect(() => {
    dispatch(createRobotCalibrationCheckSession(robotName))
  }, [dispatch, robotName])

  function proceed() {
    log.debug('proceeded to next robot cal check step', nextSteps)
  }

  function exit() {
    dispatch(deleteRobotCalibrationCheckSession(robotName))
    closeCalibrationCheck()
  }

  let stepContents
  let modalContentsClassName = styles.modal_contents

  switch (currentStep) {
    case ROBOT_CALIBRATION_CHECK_STEPS.SESSION_START: {
      stepContents = (
        <Introduction
          proceed={proceed}
          exit={exit}
          labwareLoadNames={labware.map(l => l.loadName)}
        />
      )
      break
    }
    case ROBOT_CALIBRATION_CHECK_STEPS.LOAD_LABWARE:
    case ROBOT_CALIBRATION_CHECK_STEPS.PICK_UP_TIP:
    case ROBOT_CALIBRATION_CHECK_STEPS.CHECK_POINT_ONE:
    case ROBOT_CALIBRATION_CHECK_STEPS.CHECK_POINT_TWO:
    case ROBOT_CALIBRATION_CHECK_STEPS.CHECK_POINT_THREE:
    case ROBOT_CALIBRATION_CHECK_STEPS.CHECK_HEIGHT:
    case ROBOT_CALIBRATION_CHECK_STEPS.SESSION_EXIT:
    case ROBOT_CALIBRATION_CHECK_STEPS.BAD_ROBOT_CALIBRATION:
    case ROBOT_CALIBRATION_CHECK_STEPS.NO_PIPETTES_ATTACHED: {
      stepContents = <CompleteConfirmation robotName={robotName} exit={exit} />
      modalContentsClassName = styles.terminal_modal_contents
      break
    }
    default: {
      stepContents = null
    }
  }

  return (
    <ModalPage
      titleBar={{
        title: ROBOT_CALIBRATION_CHECK_SUBTITLE,
        back: { onClick: exit },
      }}
      contentsClassName={modalContentsClassName}
    >
      {stepContents}
    </ModalPage>
  )
}
