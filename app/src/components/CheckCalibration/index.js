// @flow
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ModalPage, Icon } from '@opentrons/components'
import { getPipetteModelSpecs } from '@opentrons/shared-data'
import type { State, Dispatch } from '../../types'
import * as Calibration from '../../calibration'

import { Introduction } from './Introduction'
import { DeckSetup } from './DeckSetup'
import { TipPickUp } from './TipPickUp'
import { CompleteConfirmation } from './CompleteConfirmation'
import { CheckXYPoint } from './CheckXYPoint'
import { CheckHeight } from './CheckHeight'
import { BadCalibration } from './BadCalibration'
import styles from './styles.css'

const ROBOT_CALIBRATION_CHECK_SUBTITLE = 'Check deck calibration'
const MOVE_TO_NEXT = 'move to next check'
const CONTINUE = 'continue'
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

  const { currentStep, labware, instruments, comparisonsByStep } =
    useSelector((state: State) =>
      Calibration.getRobotCalibrationCheckSession(state, robotName)
    ) || {}
  React.useEffect(() => {
    dispatch(Calibration.fetchRobotCalibrationCheckSession(robotName))
  }, [dispatch, robotName])

  // TODO: BC: once robot keeps track of active pipette, grab that
  // from the cal check session status instead of arbitrarily
  // defaulting to the first pipette
  const hasTwoPipettes = React.useMemo(
    () => instruments && Object.keys(instruments).length === 2,
    [instruments]
  )

  const activeInstrument = React.useMemo(() => {
    const rank = getPipetteRankForStep(currentStep)
    return (
      instruments &&
      instruments[
        Object.keys(instruments).find(mount => instruments[mount].rank === rank)
      ]
    )
  }, [currentStep, instruments])

  const activeLabware = React.useMemo(
    () =>
      labware &&
      activeInstrument &&
      labware.find(l => l.id === activeInstrument.tiprack_id),
    [labware, activeInstrument]
  )
  const isActiveInstrumentMultiChannel = React.useMemo(() => {
    const spec = instruments && getPipetteModelSpecs(activeInstrument?.model)
    return spec ? spec.channels > 1 : false
  }, [activeInstrument, instruments])
  // TODO: BC: once api returns real values for instrument.mount_axis
  // infer active mount from activeInstrument

  function exit() {
    dispatch(Calibration.deleteRobotCalibrationCheckSession(robotName))
    closeCalibrationCheck()
  }

  let stepContents
  let modalContentsClassName = styles.modal_contents

  switch (currentStep) {
    case Calibration.CHECK_STEP_SESSION_STARTED: {
      stepContents = (
        <Introduction
          exit={exit}
          robotName={robotName}
          labwareLoadNames={labware.map(l => l.loadName)}
        />
      )
      break
    }
    case Calibration.CHECK_STEP_LABWARE_LOADED: {
      stepContents = <DeckSetup robotName={robotName} labware={labware} />
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
          robotName={robotName}
          isMulti={isActiveInstrumentMultiChannel}
          isInspecting={isInspecting}
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
          robotName={robotName}
          slotNumber={slotNumber}
          isMulti={isActiveInstrumentMultiChannel}
          mount={activeInstrument.mount.toLowerCase()}
          exit={exit}
          isInspecting={isInspecting}
          comparison={comparisonsByStep[currentStep]}
          nextButtonText={nextButtonText}
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
          robotName={robotName}
          isMulti={isActiveInstrumentMultiChannel}
          mount={activeInstrument.mount.toLowerCase()}
          exit={exit}
          isInspecting={isInspecting}
          comparison={comparisonsByStep[currentStep]}
          nextButtonText={nextButtonText}
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
      // TODO: BC: get real complete state name after it is update on server side
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
      stepContents = (
        <div className={styles.modal_contents}>
          <Icon name="ot-spinner" className={styles.loading_spinner} spin />
        </div>
      )
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
