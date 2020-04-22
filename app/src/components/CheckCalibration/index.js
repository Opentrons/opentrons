// @flow
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ModalPage, PrimaryButton } from '@opentrons/components'
import { getPipetteModelSpecs } from '@opentrons/shared-data'
import type { State, Dispatch } from '../../types'
import {
  fetchRobotCalibrationCheckSession,
  deleteRobotCalibrationCheckSession,
  getRobotCalibrationCheckSession,
  CHECK_STEP_SESSION_STARTED,
  CHECK_STEP_LABWARE_LOADED,
  CHECK_STEP_PREPARING_PIPETTE,
  CHECK_STEP_INSPECTING_TIP,
  CHECK_STEP_CHECKING_POINT_ONE,
  CHECK_STEP_CHECKING_POINT_TWO,
  CHECK_STEP_CHECKING_POINT_THREE,
  CHECK_STEP_CHECKING_HEIGHT,
  CHECK_STEP_SESSION_EXITED,
  CHECK_STEP_BAD_ROBOT_CALIBRATION,
  CHECK_STEP_NO_PIPETTES_ATTACHED,
  shimCurrentStep,
} from '../../calibration'
import { RIGHT } from '../../pipettes'

import { Introduction } from './Introduction'
import { DeckSetup } from './DeckSetup'
import { TipPickUp } from './TipPickUp'
import { CompleteConfirmation } from './CompleteConfirmation'
import styles from './styles.css'

const AXIS_BY_MOUNT = { left: 'z', right: 'a' }

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
  }, [activeInstrumentId])

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
    case CHECK_STEP_PREPARING_PIPETTE: {
      stepContents =
        activeInstrumentId && activeLabware ? (
          <TipPickUp
            tiprack={activeLabware}
            robotName={robotName}
            pipetteId={activeInstrumentId}
            isMulti={isActiveInstrumentMultiChannel}
          />
        ) : null
      break
    }
    case CHECK_STEP_INSPECTING_TIP:
    case CHECK_STEP_CHECKING_POINT_ONE:
    case CHECK_STEP_CHECKING_POINT_TWO:
    case CHECK_STEP_CHECKING_POINT_THREE:
    case CHECK_STEP_CHECKING_HEIGHT:
    case CHECK_STEP_SESSION_EXITED:
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
        <PrimaryButton
          onClick={() =>
            dispatch(shimCurrentStep(robotName, CHECK_STEP_SESSION_STARTED))
          }
        >
          'StartSession'
        </PrimaryButton>
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
