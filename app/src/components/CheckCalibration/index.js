// @flow
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ModalPage } from '@opentrons/components'
import type { State, Dispatch } from '../../types'
import {
  createRobotCalibrationCheckSession,
  deleteRobotCalibrationCheckSession,
  getRobotCalibrationCheckSession,
  CHECK_STEP_SESSION_START,
  CHECK_STEP_LOAD_LABWARE,
  CHECK_STEP_PICK_UP_TIP,
  CHECK_STEP_CHECK_POINT_ONE,
  CHECK_STEP_CHECK_POINT_TWO,
  CHECK_STEP_CHECK_POINT_THREE,
  CHECK_STEP_CHECK_HEIGHT,
  CHECK_STEP_SESSION_EXIT,
  CHECK_STEP_BAD_ROBOT_CALIBRATION,
  CHECK_STEP_NO_PIPETTES_ATTACHED,
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
    log.debug('TODO: proceed to next robot cal check step', nextSteps)
  }

  function exit() {
    dispatch(deleteRobotCalibrationCheckSession(robotName))
    closeCalibrationCheck()
  }

  let stepContents
  let modalContentsClassName = styles.modal_contents

  switch (currentStep) {
    case CHECK_STEP_SESSION_START: {
      stepContents = (
        <Introduction
          proceed={proceed}
          exit={exit}
          labwareLoadNames={labware.map(l => l.loadName)}
        />
      )
      break
    }
    case CHECK_STEP_LOAD_LABWARE:
    case CHECK_STEP_PICK_UP_TIP:
    case CHECK_STEP_CHECK_POINT_ONE:
    case CHECK_STEP_CHECK_POINT_TWO:
    case CHECK_STEP_CHECK_POINT_THREE:
    case CHECK_STEP_CHECK_HEIGHT:
    case CHECK_STEP_SESSION_EXIT:
    case CHECK_STEP_BAD_ROBOT_CALIBRATION:
    case CHECK_STEP_NO_PIPETTES_ATTACHED: {
      stepContents = <CompleteConfirmation robotName={robotName} exit={exit} />
      modalContentsClassName = styles.terminal_modal_contents
      break
    }
    default: {
      // TODO: BC next, this null state is visible when either:
      // 1. session accession errors
      // 2. session accession is loading
      // both should probably be handled with some sort of UI
      // affordance in the future.
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
