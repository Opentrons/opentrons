// @flow
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import last from 'lodash/last'
import {
  ModalPage,
  SpinnerModalPage,
  LEFT,
  RIGHT,
  type Mount,
  useConditionalConfirm,
} from '@opentrons/components'
import { getPipetteModelSpecs } from '@opentrons/shared-data'
import { useDispatchApiRequest, getRequestById, PENDING } from '../../robot-api'
import * as Sessions from '../../sessions'

import type { TitleBarProps } from '@opentrons/components'
import type { State, Dispatch } from '../../types'
import type { RequestState } from '../../robot-api/types'
import type { JogAxis, JogDirection, JogStep } from '../../http-api-client'
import * as SessionTypes from '../../sessions/types'

import { Introduction } from './Introduction'
import { DeckSetup } from './DeckSetup'
import { TipPickUp } from './TipPickUp'
import { ResultsSummary } from './ResultsSummary'
import { CheckXYPoint } from './CheckXYPoint'
import { CheckHeight } from './CheckHeight'
import { BadCalibration } from './BadCalibration'
import { ConfirmExitModal } from './ConfirmExitModal'
import { formatJogVector } from './utils'
import styles from './styles.css'

const ROBOT_CALIBRATION_CHECK_SUBTITLE = 'Robot calibration check'
const MOVE_TO_NEXT = 'move to next check'
const CONTINUE = 'continue'
const EXIT = 'exit'
const DROP_TIP_AND_DO_SECOND_PIPETTE =
  'drop tip in trash and continue to 2nd pipette'
const CHECK_X_Y_AXES = 'check x and y-axis'
const CHECK_Z_AXIS = 'check z-axis'

type CheckCalibrationProps = {|
  robotName: string,
  closeCalibrationCheck: () => mixed,
|}
export function CheckCalibration(props: CheckCalibrationProps): React.Node {
  const { robotName, closeCalibrationCheck } = props
  const dispatch = useDispatch<Dispatch>()
  const [dispatchRequest, requestIds] = useDispatchApiRequest()

  const requestStatus = useSelector<State, RequestState | null>(state =>
    getRequestById(state, last(requestIds))
  )?.status

  const robotCalCheckSession = useSelector((state: State) => {
    const session: Sessions.Session | null = Sessions.getRobotSessionOfType(
      state,
      robotName,
      Sessions.SESSION_TYPE_CALIBRATION_CHECK
    )
    if (
      session &&
      session.sessionType === Sessions.SESSION_TYPE_CALIBRATION_CHECK
    ) {
      return session
    }
    return {}
  })
  const { currentStep, labware, instruments, comparisonsByStep } =
    robotCalCheckSession.details || {}

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

  const activeInstrumentModel = React.useMemo(() => {
    const spec = instruments && activeInstrument && activeInstrument.model
    return spec || ''
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

  function deleteSession() {
    robotCalCheckSession.id &&
      dispatchRequest(
        Sessions.deleteSession(robotName, robotCalCheckSession.id)
      )
    closeCalibrationCheck()
  }

  const {
    showConfirmation: showConfirmExit,
    confirm: confirmExit,
    cancel: cancelExit,
  } = useConditionalConfirm(
    () => sendCommand(Sessions.checkCommands.EXIT),
    true
  )

  function sendCommand(
    command: SessionTypes.SessionCommandString,
    data: SessionTypes.SessionCommandData = {}
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
          command: Sessions.checkCommands.JOG,
          data: {
            vector: formatJogVector(axis, direction, step),
          },
        })
      )
  }

  if (requestStatus === PENDING) {
    return (
      <SpinnerModalPage titleBar={buildTitleBarProps(false, confirmExit)} />
    )
  }

  let stepContents
  let modalContentsClassName = styles.modal_contents
  let shouldDisplayTitleBarExit = true

  switch (currentStep) {
    case Sessions.CHECK_STEP_SESSION_STARTED: {
      stepContents = (
        <Introduction
          exit={confirmExit}
          proceed={() => sendCommand(Sessions.checkCommands.LOAD_LABWARE)}
          labwareLoadNames={labware.map(l => l.loadName)}
        />
      )
      break
    }
    case Sessions.CHECK_STEP_LABWARE_LOADED: {
      stepContents = (
        <DeckSetup
          proceed={() => sendCommand(Sessions.checkCommands.PREPARE_PIPETTE)}
          labware={labware}
        />
      )
      modalContentsClassName = styles.page_content_dark
      break
    }
    case Sessions.CHECK_STEP_INSPECTING_FIRST_TIP:
    case Sessions.CHECK_STEP_PREPARING_FIRST_PIPETTE:
    case Sessions.CHECK_STEP_INSPECTING_SECOND_TIP:
    case Sessions.CHECK_STEP_PREPARING_SECOND_PIPETTE: {
      const isInspecting = [
        Sessions.CHECK_STEP_INSPECTING_FIRST_TIP,
        Sessions.CHECK_STEP_INSPECTING_SECOND_TIP,
      ].includes(currentStep)

      stepContents = activeLabware ? (
        <TipPickUp
          tiprack={activeLabware}
          isMulti={isActiveInstrumentMultiChannel}
          isInspecting={isInspecting}
          tipRackWellName={tipRackWellName}
          pickUpTip={() => sendCommand(Sessions.checkCommands.PICK_UP_TIP)}
          confirmTip={() => sendCommand(Sessions.checkCommands.CONFIRM_TIP)}
          invalidateTip={() =>
            sendCommand(Sessions.checkCommands.INVALIDATE_TIP)
          }
          jog={jog}
        />
      ) : null
      break
    }
    case Sessions.CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_ONE:
    case Sessions.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_ONE:
    case Sessions.CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_TWO:
    case Sessions.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_TWO:
    case Sessions.CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_THREE:
    case Sessions.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_THREE:
    case Sessions.CHECK_STEP_JOGGING_SECOND_PIPETTE_POINT_ONE:
    case Sessions.CHECK_STEP_COMPARING_SECOND_PIPETTE_POINT_ONE: {
      const slotNumber = getSlotNumberFromStep(currentStep)

      const isInspecting = [
        Sessions.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_ONE,
        Sessions.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_TWO,
        Sessions.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_THREE,
        Sessions.CHECK_STEP_COMPARING_SECOND_PIPETTE_POINT_ONE,
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
          exit={confirmExit}
          isInspecting={isInspecting}
          comparison={comparison}
          pipetteModel={activeInstrumentModel}
          nextButtonText={nextButtonText}
          comparePoint={() => sendCommand(Sessions.checkCommands.COMPARE_POINT)}
          goToNextCheck={() =>
            sendCommand(Sessions.checkCommands.GO_TO_NEXT_CHECK)
          }
          jog={jog}
        />
      )
      break
    }
    case Sessions.CHECK_STEP_JOGGING_FIRST_PIPETTE_HEIGHT:
    case Sessions.CHECK_STEP_COMPARING_FIRST_PIPETTE_HEIGHT:
    case Sessions.CHECK_STEP_JOGGING_SECOND_PIPETTE_HEIGHT:
    case Sessions.CHECK_STEP_COMPARING_SECOND_PIPETTE_HEIGHT: {
      const isInspecting = [
        Sessions.CHECK_STEP_COMPARING_FIRST_PIPETTE_HEIGHT,
        Sessions.CHECK_STEP_COMPARING_SECOND_PIPETTE_HEIGHT,
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
          pipetteModel={activeInstrumentModel}
          nextButtonText={nextButtonText}
          exit={confirmExit}
          comparePoint={() => sendCommand(Sessions.checkCommands.COMPARE_POINT)}
          goToNextCheck={() =>
            sendCommand(Sessions.checkCommands.GO_TO_NEXT_CHECK)
          }
          jog={jog}
        />
      )
      break
    }
    case Sessions.CHECK_STEP_BAD_ROBOT_CALIBRATION: {
      shouldDisplayTitleBarExit = false
      stepContents = <BadCalibration deleteSession={deleteSession} />
      break
    }
    case Sessions.CHECK_STEP_SESSION_EXITED:
    case Sessions.CHECK_STEP_CHECK_COMPLETE:
    case Sessions.CHECK_STEP_NO_PIPETTES_ATTACHED: {
      stepContents = (
        <ResultsSummary
          robotName={robotName}
          deleteSession={deleteSession}
          comparisonsByStep={comparisonsByStep}
          instrumentsByMount={instruments}
        />
      )
      modalContentsClassName = styles.terminal_modal_contents
      shouldDisplayTitleBarExit = false
      break
    }
    default: {
    }
  }

  return (
    <>
      <ModalPage
        titleBar={buildTitleBarProps(shouldDisplayTitleBarExit, confirmExit)}
        contentsClassName={modalContentsClassName}
      >
        {stepContents}
      </ModalPage>
      {showConfirmExit && (
        <ConfirmExitModal exit={confirmExit} back={cancelExit} />
      )}
    </>
  )
}

// helpers

const getNextButtonTextForStep = (
  step: SessionTypes.RobotCalibrationCheckStep,
  hasTwoPipettes: boolean
): string => {
  switch (step) {
    case Sessions.CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_ONE:
    case Sessions.CHECK_STEP_JOGGING_SECOND_PIPETTE_POINT_ONE:
    case Sessions.CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_TWO:
    case Sessions.CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_THREE: {
      return CHECK_X_Y_AXES
    }
    case Sessions.CHECK_STEP_JOGGING_FIRST_PIPETTE_HEIGHT:
    case Sessions.CHECK_STEP_JOGGING_SECOND_PIPETTE_HEIGHT: {
      return CHECK_Z_AXIS
    }
    case Sessions.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_ONE:
    case Sessions.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_TWO:
    case Sessions.CHECK_STEP_COMPARING_FIRST_PIPETTE_HEIGHT:
    case Sessions.CHECK_STEP_COMPARING_SECOND_PIPETTE_HEIGHT: {
      return MOVE_TO_NEXT
    }
    case Sessions.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_THREE: {
      return hasTwoPipettes ? DROP_TIP_AND_DO_SECOND_PIPETTE : CONTINUE
    }
    case Sessions.CHECK_STEP_COMPARING_SECOND_PIPETTE_POINT_ONE: {
      return CONTINUE
    }
    default: {
      // should never reach this case, func only called when currentStep listed above
      return ''
    }
  }
}

const getSlotNumberFromStep = (
  step: SessionTypes.RobotCalibrationCheckStep
): string => {
  switch (step) {
    case Sessions.CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_ONE:
    case Sessions.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_ONE:
    case Sessions.CHECK_STEP_JOGGING_SECOND_PIPETTE_POINT_ONE:
    case Sessions.CHECK_STEP_COMPARING_SECOND_PIPETTE_POINT_ONE: {
      return '1'
    }
    case Sessions.CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_TWO:
    case Sessions.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_TWO: {
      return '3'
    }
    case Sessions.CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_THREE:
    case Sessions.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_THREE: {
      return '7'
    }
    default:
      // should never reach this case, func only called when currentStep listed above
      return ''
  }
}

const getPipetteRankForStep = (
  step: SessionTypes.RobotCalibrationCheckStep
): SessionTypes.RobotCalibrationCheckPipetteRank | null => {
  switch (step) {
    case Sessions.CHECK_STEP_INSPECTING_FIRST_TIP:
    case Sessions.CHECK_STEP_PREPARING_FIRST_PIPETTE:
    case Sessions.CHECK_STEP_JOGGING_FIRST_PIPETTE_HEIGHT:
    case Sessions.CHECK_STEP_COMPARING_FIRST_PIPETTE_HEIGHT:
    case Sessions.CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_ONE:
    case Sessions.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_ONE:
    case Sessions.CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_TWO:
    case Sessions.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_TWO:
    case Sessions.CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_THREE:
    case Sessions.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_THREE: {
      return Sessions.CHECK_PIPETTE_RANK_FIRST
    }
    case Sessions.CHECK_STEP_INSPECTING_SECOND_TIP:
    case Sessions.CHECK_STEP_PREPARING_SECOND_PIPETTE:
    case Sessions.CHECK_STEP_JOGGING_SECOND_PIPETTE_HEIGHT:
    case Sessions.CHECK_STEP_COMPARING_SECOND_PIPETTE_HEIGHT:
    case Sessions.CHECK_STEP_JOGGING_SECOND_PIPETTE_POINT_ONE:
    case Sessions.CHECK_STEP_COMPARING_SECOND_PIPETTE_POINT_ONE: {
      return Sessions.CHECK_PIPETTE_RANK_SECOND
    }
    default:
      // should never reach this case, func only called when currentStep listed above
      return null
  }
}

const buildTitleBarProps = (
  shouldDisplayTitleBarExit: boolean,
  confirmExit: () => mixed
): TitleBarProps => {
  return {
    title: ROBOT_CALIBRATION_CHECK_SUBTITLE,
    back: {
      onClick: confirmExit,
      title: EXIT,
      children: EXIT,
      className: !shouldDisplayTitleBarExit
        ? styles.suppress_exit_button
        : undefined,
    },
  }
}
