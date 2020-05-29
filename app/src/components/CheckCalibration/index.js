// @flow
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import last from 'lodash/last'
import {
  ModalPage,
  SpinnerModal,
  Link,
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
import type {
  SessionCommandString,
  SessionCommandData,
} from '../../sessions/types'
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

const ROBOT_CALIBRATION_CHECK_SUBTITLE = 'Check robot calibration'
const MOVE_TO_NEXT = 'move to next check'
const CONTINUE = 'continue'
const EXIT = 'exit'
const DROP_TIP_AND_DO_SECOND_PIPETTE = 'drop tip and continue to 2nd pipette'
const CHECK_X_Y_AXES = 'check x and y-axis'
const CHECK_Z_AXIS = 'check z-axis'

const INSTR_OFFSET_INSTRUCTIONS =
  'To resolve this, you will need to perform a pipette mount offset calibration. Read'
const THIS_ARTICLE = 'this article'
const TO_LEARN_MORE = 'to learn more'

// TODO: BC: Immediately confirm actual link
const INSTR_OFFSET_ARTICLE_URL =
  'http://opentrons.com/support/pipette-mount-offset'

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

  const robotCalCheckSession = useSelector((state: State) => {
    const session = Sessions.getRobotSessionOfType(
      state,
      robotName,
      Sessions.SESSION_TYPE_CALIBRATION_CHECK
    )
    return session ?? {}
  })
  const { currentStep, labware, instruments, comparisonsByStep } =
    robotCalCheckSession.details || {}

  React.useEffect(() => {
    if (robotCalCheckSession.id) {
      dispatchRequest(Sessions.fetchSession(robotName, robotCalCheckSession.id))
    } else {
      dispatchRequest(
        Sessions.createSession(
          robotName,
          Sessions.SESSION_TYPE_CALIBRATION_CHECK
        )
      )
    }
  }, [dispatchRequest, robotName, robotCalCheckSession.id])

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
    robotCalCheckSession.id &&
      dispatchRequest(
        Sessions.deleteSession(robotName, robotCalCheckSession.id)
      )
    closeCalibrationCheck()
  }

  function sendCommand(
    command: SessionCommandString,
    data: SessionCommandData = {}
  ) {
    robotCalCheckSession.id &&
      dispatchRequest(
        Sessions.createSessionCommand(robotName, robotCalCheckSession.id, {
          command,
          data,
        })
      )
  }
  function jog(axis: JogAxis, direction: JogDirection, step: JogStep) {
    robotCalCheckSession.id &&
      dispatch(
        Sessions.createSessionCommand(robotName, robotCalCheckSession.id, {
          command: Calibration.checkCommands.JOG,
          data: {
            vector: formatJogVector(axis, direction, step),
          },
        })
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
      const comparison = comparisonsByStep[currentStep]
      stepContents = (
        <CheckXYPoint
          slotNumber={slotNumber}
          isMulti={isActiveInstrumentMultiChannel}
          mount={activeMount}
          exit={exit}
          isInspecting={isInspecting}
          comparison={comparison}
          nextButtonText={nextButtonText}
          instructions={getInstructionsFromBadComparison(
            currentStep,
            comparison
          )}
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
      const comparison = comparisonsByStep[currentStep]
      stepContents = (
        <CheckHeight
          isMulti={isActiveInstrumentMultiChannel}
          mount={activeMount}
          isInspecting={isInspecting}
          comparison={comparison}
          nextButtonText={nextButtonText}
          instructions={getInstructionsFromBadComparison(
            currentStep,
            comparison
          )}
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
      const stepsPassed = Object.keys(comparisonsByStep).reduce((acc, step) => {
        return acc + (comparisonsByStep[step].exceedsThreshold ? 0 : 1)
      }, 0)
      const stepsFailed = Object.keys(comparisonsByStep).length - stepsPassed
      stepContents = (
        <CompleteConfirmation
          exit={exit}
          stepsFailed={stepsFailed}
          stepsPassed={stepsPassed}
          comparisonsByStep={comparisonsByStep}
        />
      )
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

const getInstructionsFromBadComparison = (
  step: Calibration.RobotCalibrationCheckStep,
  comparison: Calibration.RobotCalibrationCheckComparison
): React.Node | null => {
  // TODO: BC: immediately add an else if case for differentiating
  //  between "left pip only" and "right pip first" messaging
  // i.e. "deck transform cal needed" or "deck transform cal and offset cal needed"
  if (
    [
      Calibration.CHECK_STEP_COMPARING_SECOND_PIPETTE_HEIGHT,
      Calibration.CHECK_STEP_COMPARING_SECOND_PIPETTE_POINT_ONE,
    ].includes(step)
  ) {
    return (
      <p className={styles.error_explanation}>
        {INSTR_OFFSET_INSTRUCTIONS}
        &nbsp;
        <Link href={INSTR_OFFSET_ARTICLE_URL} external>
          {THIS_ARTICLE}
        </Link>
        &nbsp;
        {TO_LEARN_MORE}
      </p>
    )
  } else {
    return null
  }
}
