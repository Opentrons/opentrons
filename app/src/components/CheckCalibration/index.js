// @flow
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ModalPage, Icon } from '@opentrons/components'
import { getPipetteModelSpecs } from '@opentrons/shared-data'
import type { State, Dispatch } from '../../types'
import {
  fetchRobotCalibrationCheckSession,
  deleteRobotCalibrationCheckSession,
  getRobotCalibrationCheckSession,
  CHECK_STEP_SESSION_STARTED,
  CHECK_STEP_LABWARE_LOADED,
  CHECK_STEP_PREPARING_FIRST_PIPETTE,
  CHECK_STEP_INSPECTING_FIRST_TIP,
  CHECK_STEP_JOGGING_FIRST_PIPETTE_HEIGHT,
  CHECK_STEP_COMPARING_FIRST_PIPETTE_HEIGHT,
  CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_ONE,
  CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_ONE,
  CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_TWO,
  CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_TWO,
  CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_THREE,
  CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_THREE,
  CHECK_STEP_PREPARING_SECOND_PIPETTE,
  CHECK_STEP_INSPECTING_SECOND_TIP,
  CHECK_STEP_JOGGING_SECOND_PIPETTE_HEIGHT,
  CHECK_STEP_COMPARING_SECOND_PIPETTE_HEIGHT,
  CHECK_STEP_JOGGING_SECOND_PIPETTE_POINT_ONE,
  CHECK_STEP_COMPARING_SECOND_PIPETTE_POINT_ONE,
  CHECK_STEP_CHECK_COMPLETE,
  CHECK_STEP_SESSION_EXITED,
  CHECK_STEP_BAD_ROBOT_CALIBRATION,
  CHECK_STEP_NO_PIPETTES_ATTACHED,
  type RobotCalibrationCheckStep,
} from '../../calibration'

import { Introduction } from './Introduction'
import { DeckSetup } from './DeckSetup'
import { TipPickUp } from './TipPickUp'
import { CompleteConfirmation } from './CompleteConfirmation'
import styles from './styles.css'
import { CheckXYPoint } from './CheckXYPoint'
import { CheckHeight } from './CheckHeight'

const ROBOT_CALIBRATION_CHECK_SUBTITLE = 'Check deck calibration'

type CheckCalibrationProps = {|
  robotName: string,
  closeCalibrationCheck: () => mixed,
|}
export function CheckCalibration(props: CheckCalibrationProps) {
  const { robotName, closeCalibrationCheck } = props
  const dispatch = useDispatch<Dispatch>()

  const { currentStep, labware, instruments } =
    useSelector((state: State) =>
      getRobotCalibrationCheckSession(state, robotName)
    ) || {}
  React.useEffect(() => {
    dispatch(fetchRobotCalibrationCheckSession(robotName))
  }, [dispatch, robotName])

  // TODO: BC: once robot keeps track of active pipette, grab that
  // from the cal check session status instead of arbitrarily
  // defaulting to the first pipette
  const activeInstrumentId = React.useMemo(
    () => instruments && Object.keys(instruments)[0],
    [instruments]
  )
  const activeLabware = React.useMemo(
    () =>
      labware && labware.find(l => l.forPipettes.includes(activeInstrumentId)),
    [labware, activeInstrumentId]
  )
  const isActiveInstrumentMultiChannel = React.useMemo(() => {
    const spec =
      instruments &&
      getPipetteModelSpecs(instruments[activeInstrumentId]?.model)
    return spec ? spec.channels > 1 : false
  }, [activeInstrumentId, instruments])
  // TODO: BC: once api returns real values for instrument.mount_axis
  // infer active mount from activeInstrument
  const activeMount = 'left'

  function exit() {
    dispatch(deleteRobotCalibrationCheckSession(robotName))
    closeCalibrationCheck()
  }

  let stepContents
  let modalContentsClassName = styles.modal_contents

  switch (currentStep) {
    case CHECK_STEP_SESSION_STARTED: {
      stepContents = (
        <Introduction
          exit={exit}
          robotName={robotName}
          labwareLoadNames={labware.map(l => l.loadName)}
        />
      )
      break
    }
    case CHECK_STEP_LABWARE_LOADED: {
      stepContents = (
        <DeckSetup
          robotName={robotName}
          activeInstrumentId={activeInstrumentId}
          labware={labware}
        />
      )
      modalContentsClassName = styles.page_content_dark
      break
    }
    case CHECK_STEP_INSPECTING_FIRST_TIP:
    case CHECK_STEP_PREPARING_FIRST_PIPETTE:
    case CHECK_STEP_INSPECTING_SECOND_TIP:
    case CHECK_STEP_PREPARING_SECOND_PIPETTE: {
      const isInspecting = [
        CHECK_STEP_INSPECTING_FIRST_TIP,
        CHECK_STEP_INSPECTING_SECOND_TIP,
      ].includes(currentStep)
      stepContents =
        activeInstrumentId && activeLabware ? (
          <TipPickUp
            tiprack={activeLabware}
            robotName={robotName}
            pipetteId={activeInstrumentId}
            isMulti={isActiveInstrumentMultiChannel}
            isInspecting={isInspecting}
          />
        ) : null
      break
    }
    case CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_ONE:
    case CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_ONE:
    case CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_TWO:
    case CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_TWO:
    case CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_THREE:
    case CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_THREE:
    case CHECK_STEP_JOGGING_SECOND_PIPETTE_POINT_ONE:
    case CHECK_STEP_COMPARING_SECOND_PIPETTE_POINT_ONE: {
      const slotNumber: { [RobotCalibrationCheckStep]: string } = {
        [CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_ONE]: '1',
        [CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_ONE]: '1',
        [CHECK_STEP_JOGGING_SECOND_PIPETTE_POINT_ONE]: '1',
        [CHECK_STEP_COMPARING_SECOND_PIPETTE_POINT_ONE]: '1',
        [CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_TWO]: '3',
        [CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_TWO]: '3',
        [CHECK_STEP_JOGGING_FIRST_PIPETTE_POINT_THREE]: '7',
        [CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_THREE]: '7',
      }[currentStep]

      const isInspecting = [
        CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_ONE,
        CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_TWO,
        CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_THREE,
        CHECK_STEP_COMPARING_SECOND_PIPETTE_POINT_ONE,
      ].includes(currentStep)
      stepContents =
        activeInstrumentId && slotNumber != null ? (
          <CheckXYPoint
            robotName={robotName}
            pipetteId={activeInstrumentId}
            slotNumber={slotNumber}
            isMulti={isActiveInstrumentMultiChannel}
            mount={activeMount}
            isInspecting={isInspecting}
          />
        ) : null
      break
    }
    case CHECK_STEP_JOGGING_FIRST_PIPETTE_HEIGHT:
    case CHECK_STEP_COMPARING_FIRST_PIPETTE_HEIGHT:
    case CHECK_STEP_JOGGING_SECOND_PIPETTE_HEIGHT:
    case CHECK_STEP_COMPARING_SECOND_PIPETTE_HEIGHT: {
      const isInspecting = [
        CHECK_STEP_COMPARING_FIRST_PIPETTE_HEIGHT,
        CHECK_STEP_COMPARING_SECOND_PIPETTE_HEIGHT,
      ].includes(currentStep)

      stepContents = activeInstrumentId ? (
        <CheckHeight
          robotName={robotName}
          pipetteId={activeInstrumentId}
          isMulti={isActiveInstrumentMultiChannel}
          mount={activeMount}
          isInspecting={isInspecting}
        />
      ) : null
      break
    }
    case CHECK_STEP_SESSION_EXITED:
    case CHECK_STEP_CHECK_COMPLETE:
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
