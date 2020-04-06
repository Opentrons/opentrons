// @flow
import * as React from 'react'
import { useDispatch } from 'react-redux'
import { ModalPage } from '@opentrons/components'
import type { Dispatch } from '../../types'
import {
  // createRobotCalibrationCheckSession,
  deleteRobotCalibrationCheckSession,
  // getRobotCalibrationCheckSession,
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
import { DeckSetup } from './DeckSetup'
import { CompleteConfirmation } from './CompleteConfirmation'
import styles from './styles.css'

// START TEMPORARY DEV STUBS
const STUB_STEP_ORDER = [
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
]

const STUB_PIPETTES_BY_ID = {
  '5e1b4a9b88cf4bdebd1002f1aa39891e': {
    model: 'p300_multi_v1',
    name: 'p300_multi',
    tip_length: 51.7,
    mount_axis: 2,
    plunger_axis: 4,
    pipette_id: 'P300M180502A17',
  },
  '9d0ffd691dc546f9aa9b081edb40500c': {
    model: 'p300_single_v1',
    name: 'p300_single',
    tip_length: 51.7,
    mount_axis: 3,
    plunger_axis: 5,
    pipette_id: 'P300S180411A08',
  },
}
const STUB_LABWARE = [
  {
    alternatives: ['opentrons_96_filtertiprack_300ul'],
    slot: '8',
    id: '75011540-c06b-4292-a4a3-316f236fd92a',
    forPipettes: ['5e1b4a9b-88cf-4bde-bd10-02f1aa39891e'],
    loadName: 'opentrons_96_tiprack_300ul',
    namespace: 'opentrons',
    version: 1,
  },
  {
    alternatives: ['opentrons_96_filtertiprack_1000ul'],
    slot: '6',
    id: '123_fake_id',
    forPipettes: ['9d0ffd69-1dc5-46f9-aa9b-081edb40500c'],
    loadName: 'opentrons_96_tiprack_1000ul',
    namespace: 'opentrons',
    version: 1,
  },
]
// END TEMPORARY DEV STUBS

const log = createLogger(__filename)

const ROBOT_CALIBRATION_CHECK_SUBTITLE = 'Check deck calibration'

type CheckCalibrationProps = {|
  robotName: string,
  closeCalibrationCheck: () => mixed,
|}
export function CheckCalibration(props: CheckCalibrationProps) {
  const { robotName, closeCalibrationCheck } = props
  const dispatch = useDispatch<Dispatch>()

  // TODO: ONCE BACKEND SETTLES UNCOMMENT SESSION LOGIC

  // const { currentStep, nextSteps, labware } =
  //   useSelector((state: State) =>
  //     getRobotCalibrationCheckSession(state, robotName)
  //   ) || {}
  // React.useEffect(() => {
  //   dispatch(createRobotCalibrationCheckSession(robotName))
  // }, [dispatch, robotName])

  // TODO: ONCE BACKEND SETTLES REMOVE THIS STUB
  const [currentStep, setCurrentStep] = React.useState(CHECK_STEP_SESSION_START)
  const labware = STUB_LABWARE
  const instruments = STUB_PIPETTES_BY_ID

  function proceed() {
    const nextStep =
      STUB_STEP_ORDER[STUB_STEP_ORDER.findIndex(s => s === currentStep) + 1]
    log.debug('Proceeded to next step', {
      instruments,
      labware,
      currentStep,
      nextStep,
    })
    setCurrentStep(nextStep)
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
    case CHECK_STEP_LOAD_LABWARE: {
      stepContents = <DeckSetup proceed={proceed} labware={labware} />
      modalContentsClassName = styles.page_content_dark
      break
    }
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
