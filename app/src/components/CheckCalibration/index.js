// @flow
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
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
import { RIGHT, LEFT } from '../../pipettes'
import { createLogger } from '../../logger'

import { Introduction } from './Introduction'
import { DeckSetup } from './DeckSetup'
import { TipPickUp } from './TipPickUp'
import { CompleteConfirmation } from './CompleteConfirmation'
import styles from './styles.css'

const AXIS_BY_MOUNT = { left: 'z', right: 'a' }
const log = createLogger(__filename)

const ROBOT_CALIBRATION_CHECK_SUBTITLE = 'Check deck calibration'

type CheckCalibrationProps = {|
  robotName: string,
  closeCalibrationCheck: () => mixed,
|}
export function CheckCalibration(props: CheckCalibrationProps) {
  const { robotName, closeCalibrationCheck } = props
  const dispatch = useDispatch<Dispatch>()

  const { currentStep, nextSteps, labware, instruments } =
    useSelector((state: State) =>
      getRobotCalibrationCheckSession(state, robotName)
    ) || {}
  React.useEffect(() => {
    dispatch(createRobotCalibrationCheckSession(robotName))
  }, [dispatch, robotName])

  const [activeMount, setActiveMount] = React.useState(RIGHT)

  const activeInstrumentId = React.useMemo(() => (
    Object.keys(instruments).find((id) => instruments[id].mount_axis === AXIS_BY_MOUNT[activeMount])
  ), [instruments, activeMount])
  const activeLabware = React.useMemo(() => (
    labware.find(l => (
      l.forPipettes.includes(activeInstrumentId)
    ))
  ), [labware, activeInstrumentId])
  console.table({
    activeInstrumentId,
    activeLabware,
    labware
  })
  function proceed() {
    log.debug('Proceed to next step', {
      instruments,
      labware,
      currentStep,
    })
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
    case CHECK_STEP_PICK_UP_TIP: {
      stepContents = activeInstrumentId && activeLabware ? (
        <TipPickUp
          proceed={proceed}
          tiprack={activeLabware}
          pipette={instruments[activeInstrumentId]}
        />
      ) : null
      break
    }
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
