// @flow
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import last from 'lodash/last'
import {
  ModalPage,
  SpinnerModal,
  LEFT,
  RIGHT,
  type Mount,
} from '@opentrons/components'
import { getPipetteModelSpecs } from '@opentrons/shared-data'
import type { State, Dispatch } from '../../types'
import { useDispatchApiRequest, getRequestById, PENDING } from '../../robot-api'
import type { RequestState } from '../../robot-api/types'
import * as Calibration from '../../calibration'
import * as Sessions from '../../sessions'
import type { JogAxis, JogDirection, JogStep } from '../../http-api-client'

import { Introduction } from './Introduction'
import { DeckSetup } from './DeckSetup'
import { TipPickUp } from './TipPickUp'
import { CompleteConfirmation } from './CompleteConfirmation'
import { CheckXYPoint } from './CheckXYPoint'
import { CheckHeight } from './CheckHeight'
import { BadCalibration } from './BadCalibration'
import { formatJogVector } from './utils'
import styles from './styles.css'

const ROBOT_CALIBRATION_CHECK_SUBTITLE = 'Check deck calibration'
const MOVE_TO_NEXT = 'move to next check'
const CONTINUE = 'continue'
const EXIT = 'exit'
const DROP_TIP_AND_DO_SECOND_PIPETTE = 'drop tip and continue to 2nd pipette'
const CHECK_X_Y_AXES = 'check x and y-axis'
const CHECK_Z_AXIS = 'check z-axis'

type CheckCalibrationProps = {|
  robotName: string,
  closeCalibrationCheck: () => mixed,
|}
export function CheckCalibration(props: CheckCalibrationProps) {
  const { robotName, closeCalibrationCheck } = props
  const dispatch = useDispatch<Dispatch>()
  const [dispatchRequest, requestIds] = useDispatchApiRequest()

  const requestStatus = useSelector<State, RequestState | null>(state =>
    getRequestById(state, last(requestIds))
  )?.status
  const pending = requestStatus === PENDING

  const { currentStep, labware, instruments, comparisonsByStep } =
    useSelector((state: State) => {
      const session = Sessions.getRobotSessionById(
        state,
        robotName,
        Calibration.CALIBRATION_CHECK_SESSION_ID
      )
      return session ? session.details : null
    }) || {}
  React.useEffect(() => {
    dispatchRequest(
      Sessions.fetchSession(robotName, Calibration.CALIBRATION_CHECK_SESSION_ID)
    )
  }, [dispatchRequest, robotName])

  const hasTwoPipettes = React.useMemo(
    () => instruments && Object.keys(instruments).length === 2,
    [instruments]
  )

  const activeInstrument = React.useMemo(() => {
    const rank = getPipetteRankForStep(currentStep)
    const activeInstrId =
      instruments &&
      Object.keys(instruments).find(mount =>
        mount ? instruments[mount]?.rank === rank : null
      )
    return activeInstrId && instruments[activeInstrId]
  }, [currentStep, instruments])

  const activeMount: Mount | null = React.useMemo(() => {
    const rawMount = activeInstrument && activeInstrument.mount.toLowerCase()
    return [LEFT, RIGHT].find(m => m === rawMount) || null
  }, [activeInstrument])

  const activeLabware = React.useMemo(
    () =>
      labware &&
      activeInstrument &&
      labware.find(l => l.id === activeInstrument.tiprack_id),
    [labware, activeInstrument]
  )
  const isActiveInstrumentMultiChannel = React.useMemo(() => {
    const spec =
      instruments &&
      activeInstrument &&
      getPipetteModelSpecs(activeInstrument?.model)
    return spec ? spec.channels > 1 : false
  }, [activeInstrument, instruments])

  const tipRackWellName: string = React.useMemo(() => {
    const instr_ids = instruments ? Object.keys(instruments) : []
    if (!activeInstrument) {
      return ''
    } else if (
      hasTwoPipettes &&
      instruments[instr_ids[0]]?.tiprack_id ===
        instruments[instr_ids[1]]?.tiprack_id &&
      activeInstrument.mount.toLowerCase() === LEFT
    ) {
      return 'B1'
    } else if (instr_ids.length > 0) {
      return 'A1'
    } else {
      return ''
    }
  }, [instruments, activeInstrument, hasTwoPipettes])

  function exit() {
    dispatchRequest(
      Sessions.deleteSession(
        robotName,
        Calibration.CALIBRATION_CHECK_SESSION_ID
      )
    )
    closeCalibrationCheck()
  }

  function sendCommand(command: string, data: { ... }) {
    dispatchRequest(
      Sessions.createSessionCommand(
        robotName,
        Calibration.CALIBRATION_CHECK_SESSION_ID,
        { command, data }
      )
    )
  }
  function jog(axis: JogAxis, direction: JogDirection, step: JogStep) {
    dispatch(
      Sessions.createSessionCommand(
        robotName,
        Calibration.CALIBRATION_CHECK_SESSION_ID,
        {
          command: Calibration.checkCommands.JOG,
          data: {
            vector: formatJogVector(axis, direction, step),
          },
        }
      )
    )
  }

  let stepContents
  let modalContentsClassName = styles.modal_contents

  switch (currentStep) {
    case Calibration.CHECK_STEP_SESSION_STARTED: {
      stepContents = (
        <Introduction
          exit={exit}
          proceed={() => sendCommand(Calibration.checkCommands.LOAD_LABWARE)}
          labwareLoadNames={labware.map(l => l.loadName)}
        />
      )
      break
    }
    case Calibration.CHECK_STEP_LABWARE_LOADED: {
      stepContents = (
        <DeckSetup
          proceed={() => sendCommand(Calibration.checkCommands.PREPARE_PIPETTE)}
          labware={labware}
        />
      )
      modalContentsClassName = styles.page_content_dark
      break
    }
    case Calibration.CHECK_STEP_INSPECTING_FIRST_TIP:
    case Calibration.CHECK_STEP_PREPARING_FIRST_PIPETTE:
    case Calibration.CHECK_STEP_INSPECTING_SECOND_TIP:
    case Calibration.CHECK_STEP_PREPARING_SECOND_PIPETTE: {
      const isInspecting = [
        Calibration.CHECK_STEP_INSPECTING_FIRST_TIP,
        Calibration.CHECK_STEP_INSPECTING_SECOND_TIP,
      ].includes(currentStep)

      stepContents = activeLabware ? (
        <TipPickUp
          tiprack={activeLabware}
          isMulti={isActiveInstrumentMultiChannel}
          isInspecting={isInspecting}
          tipRackWellName={tipRackWellName}
          pickUpTip={() => sendCommand(Calibration.checkCommands.PICK_UP_TIP)}
          confirmTip={() => sendCommand(Calibration.checkCommands.CONFIRM_TIP)}
          invalidateTip={() =>
            sendCommand(Calibration.checkCommands.INVALIDATE_TIP)
          }
          jog={jog}
        />
      ) : null
      break
    }
    case Calibration.CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_ONE:
    case Calibration.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_ONE:
    case Calibration.CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_TWO:
    case Calibration.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_TWO:
    case Calibration.CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_THREE:
    case Calibration.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_THREE:
    case Calibration.CHECK_STEP_JOGGING_SECOND_PIPETTE_POINT_ONE:
    case Calibration.CHECK_STEP_COMPARING_SECOND_PIPETTE_POINT_ONE: {
      const slotNumber = getSlotNumberFromStep(currentStep)

      const isInspecting = [
        Calibration.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_ONE,
        Calibration.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_TWO,
        Calibration.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_THREE,
        Calibration.CHECK_STEP_COMPARING_SECOND_PIPETTE_POINT_ONE,
      ].includes(currentStep)
      const nextButtonText = getNextButtonTextForStep(
        currentStep,
        hasTwoPipettes
      )
      stepContents = (
        <CheckXYPoint
          slotNumber={slotNumber}
          isMulti={isActiveInstrumentMultiChannel}
          mount={activeMount}
          exit={exit}
          isInspecting={isInspecting}
          comparison={comparisonsByStep[currentStep]}
          nextButtonText={nextButtonText}
          comparePoint={() =>
            sendCommand(Calibration.checkCommands.COMPARE_POINT)
          }
          goToNextCheck={() =>
            sendCommand(Calibration.checkCommands.GO_TO_NEXT_CHECK)
          }
          jog={jog}
        />
      )
      break
    }
    case Calibration.CHECK_STEP_JOGGING_FIRST_PIPETTE_HEIGHT:
    case Calibration.CHECK_STEP_COMPARING_FIRST_PIPETTE_HEIGHT:
    case Calibration.CHECK_STEP_JOGGING_SECOND_PIPETTE_HEIGHT:
    case Calibration.CHECK_STEP_COMPARING_SECOND_PIPETTE_HEIGHT: {
      const isInspecting = [
        Calibration.CHECK_STEP_COMPARING_FIRST_PIPETTE_HEIGHT,
        Calibration.CHECK_STEP_COMPARING_SECOND_PIPETTE_HEIGHT,
      ].includes(currentStep)
      const nextButtonText = getNextButtonTextForStep(
        currentStep,
        hasTwoPipettes
      )
      stepContents = (
        <CheckHeight
          isMulti={isActiveInstrumentMultiChannel}
          mount={activeMount}
          isInspecting={isInspecting}
          comparison={comparisonsByStep[currentStep]}
          nextButtonText={nextButtonText}
          exit={exit}
          comparePoint={() =>
            sendCommand(Calibration.checkCommands.COMPARE_POINT)
          }
          goToNextCheck={() =>
            sendCommand(Calibration.checkCommands.GO_TO_NEXT_CHECK)
          }
          jog={jog}
        />
      )
      break
    }
    case Calibration.CHECK_STEP_BAD_ROBOT_CALIBRATION: {
      stepContents = <BadCalibration exit={exit} />
      break
    }
    case Calibration.CHECK_STEP_SESSION_EXITED:
    case Calibration.CHECK_STEP_CHECK_COMPLETE:
    case Calibration.CHECK_STEP_NO_PIPETTES_ATTACHED: {
      stepContents = <CompleteConfirmation robotName={robotName} exit={exit} />
      modalContentsClassName = styles.terminal_modal_contents
      break
    }
    default: {
      stepContents = <SpinnerModal />
    }
  }

  return (
    <ModalPage
      titleBar={{
        title: ROBOT_CALIBRATION_CHECK_SUBTITLE,
        back: { onClick: exit, children: EXIT, title: EXIT },
      }}
      contentsClassName={modalContentsClassName}
    >
      {pending ? <SpinnerModal /> : stepContents}
    </ModalPage>
  )
}

// helpers

const getNextButtonTextForStep = (
  step: Calibration.RobotCalibrationCheckStep,
  hasTwoPipettes: boolean
): string => {
  switch (step) {
    case Calibration.CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_ONE:
    case Calibration.CHECK_STEP_JOGGING_SECOND_PIPETTE_POINT_ONE:
    case Calibration.CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_TWO:
    case Calibration.CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_THREE: {
      return CHECK_X_Y_AXES
    }
    case Calibration.CHECK_STEP_JOGGING_FIRST_PIPETTE_HEIGHT:
    case Calibration.CHECK_STEP_JOGGING_SECOND_PIPETTE_HEIGHT: {
      return CHECK_Z_AXIS
    }
    case Calibration.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_ONE:
    case Calibration.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_TWO:
    case Calibration.CHECK_STEP_COMPARING_FIRST_PIPETTE_HEIGHT:
    case Calibration.CHECK_STEP_COMPARING_SECOND_PIPETTE_HEIGHT: {
      return MOVE_TO_NEXT
    }
    case Calibration.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_THREE: {
      return hasTwoPipettes ? DROP_TIP_AND_DO_SECOND_PIPETTE : CONTINUE
    }
    case Calibration.CHECK_STEP_COMPARING_SECOND_PIPETTE_POINT_ONE: {
      return CONTINUE
    }
    default: {
      // should never reach this case, func only called when currentStep listed above
      return ''
    }
  }
}

const getSlotNumberFromStep = (
  step: Calibration.RobotCalibrationCheckStep
): string => {
  switch (step) {
    case Calibration.CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_ONE:
    case Calibration.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_ONE:
    case Calibration.CHECK_STEP_JOGGING_SECOND_PIPETTE_POINT_ONE:
    case Calibration.CHECK_STEP_COMPARING_SECOND_PIPETTE_POINT_ONE: {
      return '1'
    }
    case Calibration.CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_TWO:
    case Calibration.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_TWO: {
      return '3'
    }
    case Calibration.CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_THREE:
    case Calibration.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_THREE: {
      return '7'
    }
    default:
      // should never reach this case, func only called when currentStep listed above
      return ''
  }
}

const getPipetteRankForStep = (
  step: Calibration.RobotCalibrationCheckStep
): string => {
  switch (step) {
    case Calibration.CHECK_STEP_INSPECTING_FIRST_TIP:
    case Calibration.CHECK_STEP_PREPARING_FIRST_PIPETTE:
    case Calibration.CHECK_STEP_JOGGING_FIRST_PIPETTE_HEIGHT:
    case Calibration.CHECK_STEP_COMPARING_FIRST_PIPETTE_HEIGHT:
    case Calibration.CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_ONE:
    case Calibration.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_ONE:
    case Calibration.CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_TWO:
    case Calibration.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_TWO:
    case Calibration.CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_THREE:
    case Calibration.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_THREE: {
      return 'first'
    }
    case Calibration.CHECK_STEP_INSPECTING_SECOND_TIP:
    case Calibration.CHECK_STEP_PREPARING_SECOND_PIPETTE:
    case Calibration.CHECK_STEP_JOGGING_SECOND_PIPETTE_HEIGHT:
    case Calibration.CHECK_STEP_COMPARING_SECOND_PIPETTE_HEIGHT:
    case Calibration.CHECK_STEP_JOGGING_SECOND_PIPETTE_POINT_ONE:
    case Calibration.CHECK_STEP_COMPARING_SECOND_PIPETTE_POINT_ONE: {
      return 'second'
    }
    default:
      // should never reach this case, func only called when currentStep listed above
      return ''
  }
}
