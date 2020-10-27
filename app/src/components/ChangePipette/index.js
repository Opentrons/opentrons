// @flow
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { getPipetteNameSpecs, shouldLevel } from '@opentrons/shared-data'

import {
  useDispatchApiRequests,
  getRequestById,
  SUCCESS,
  PENDING,
} from '../../robot-api'
import { getCalibrationForPipette } from '../../calibration'
import { getAttachedPipettes } from '../../pipettes'
import {
  home,
  move,
  getMovementStatus,
  HOMING,
  MOVING,
  ROBOT,
  PIPETTE,
  CHANGE_PIPETTE,
  HOME,
} from '../../robot-controls'

import { useCalibratePipetteOffset } from '../CalibratePipetteOffset/useCalibratePipetteOffset'
import { useAskForCalibrationBlock } from '../CalibrateTipLength/useAskForCalibrationBlock'
import { INTENT_PIPETTE_OFFSET } from '../CalibrationPanels'
import { ClearDeckAlertModal } from '../ClearDeckAlertModal'
import { ExitAlertModal } from './ExitAlertModal'
import { Instructions } from './Instructions'
import { ConfirmPipette } from './ConfirmPipette'
import { RequestInProgressModal } from './RequestInProgressModal'
import { LevelPipette } from './LevelPipette'

import {
  ATTACH,
  DETACH,
  CLEAR_DECK,
  INSTRUCTIONS,
  CONFIRM,
  CALIBRATE_PIPETTE,
} from './constants'

import type { State, Dispatch } from '../../types'
import type { Mount } from '../../robot/types'
import type { WizardStep } from './types'

type Props = {|
  robotName: string,
  mount: Mount,
  closeModal: () => mixed,
|}

// TODO(mc, 2019-12-18): i18n
const PIPETTE_SETUP = 'Pipette Setup'
const MOVE_PIPETTE_TO_FRONT = 'Move pipette to front'
const CANCEL = 'Cancel'
const MOUNT = 'mount'
const PIPETTE_OFFSET_CALIBRATION = 'pipette offset calibration'

export function ChangePipette(props: Props): React.Node {
  const { robotName, mount, closeModal } = props
  const dispatch = useDispatch<Dispatch>()
  const homePipRequestId = React.useRef<string | null>(null)
  const [dispatchApiRequests] = useDispatchApiRequests(dispatchedAction => {
    if (
      dispatchedAction.type === HOME &&
      dispatchedAction.payload.target === PIPETTE
    ) {
      // track final home pipette request, its success closes modal
      homePipRequestId.current = dispatchedAction.meta.requestId
    }
  })
  const [wizardStep, setWizardStep] = React.useState<WizardStep>(CLEAR_DECK)
  const [wantedName, setWantedName] = React.useState<string | null>(null)
  const [confirmExit, setConfirmExit] = React.useState(false)
  const wantedPipette = wantedName ? getPipetteNameSpecs(wantedName) : null
  const attachedPipette = useSelector(
    (state: State) => getAttachedPipettes(state, robotName)[mount]
  )
  const actualPipette = attachedPipette?.modelSpecs || null
  const actualPipetteOffset = useSelector((state: State) =>
    attachedPipette?.id
      ? getCalibrationForPipette(state, robotName, attachedPipette.id)
      : null
  )

  const movementStatus = useSelector((state: State) => {
    return getMovementStatus(state, robotName)
  })

  const homePipStatus = useSelector((state: State) => {
    return homePipRequestId.current
      ? getRequestById(state, homePipRequestId.current)
      : null
  })?.status

  React.useEffect(() => {
    if (homePipStatus === SUCCESS) {
      closeModal()
    }
  }, [homePipStatus, closeModal])

  const homePipAndExit = React.useCallback(
    () => dispatchApiRequests(home(robotName, PIPETTE, mount)),
    [dispatchApiRequests, robotName, mount]
  )

  const [
    startPipetteOffsetCalibration,
    PipetteOffsetCalibrationWizard,
  ] = useCalibratePipetteOffset(robotName, { mount }, closeModal)

  const [
    showAskForCalibrationBlock,
    AskForCalibrationBlockModal,
  ] = useAskForCalibrationBlock(calBlock => {
    startPipetteOffsetCalibration({
      overrideParams: { hasCalibrationBlock: calBlock },
      withIntent: INTENT_PIPETTE_OFFSET,
    })
  }, PIPETTE_OFFSET_CALIBRATION)

  const baseProps = {
    title: PIPETTE_SETUP,
    subtitle: `${mount} ${MOUNT}`,
    mount,
  }

  if (
    movementStatus !== null &&
    (movementStatus === HOMING || movementStatus === MOVING)
  ) {
    return (
      <RequestInProgressModal
        {...baseProps}
        movementStatus={movementStatus}
        isPipetteHoming={homePipStatus === PENDING}
      />
    )
  }

  if (wizardStep === CLEAR_DECK) {
    return (
      <ClearDeckAlertModal
        cancelText={CANCEL}
        continueText={MOVE_PIPETTE_TO_FRONT}
        onCancelClick={closeModal}
        onContinueClick={() => {
          dispatch(move(robotName, CHANGE_PIPETTE, mount, true))
          setWizardStep(INSTRUCTIONS)
        }}
      />
    )
  }

  const basePropsWithPipettes = {
    ...baseProps,
    robotName,
    wantedPipette,
    actualPipette,
    displayName: actualPipette?.displayName || wantedPipette?.displayName || '',
    displayCategory:
      actualPipette?.displayCategory || wantedPipette?.displayCategory || null,
  }

  if (wizardStep === INSTRUCTIONS) {
    const direction = actualPipette ? DETACH : ATTACH

    return (
      <>
        {confirmExit && (
          <ExitAlertModal
            back={() => setConfirmExit(false)}
            exit={homePipAndExit}
          />
        )}
        <Instructions
          {...{
            ...basePropsWithPipettes,
            direction,
            setWantedName,
            confirm: () => setWizardStep(CONFIRM),
            exit: () => setConfirmExit(true),
          }}
        />
      </>
    )
  }

  if (wizardStep === CONFIRM) {
    const success =
      // success if we were trying to detach and nothing's attached
      (!actualPipette && !wantedPipette) ||
      // or if the names of wanted and attached match
      actualPipette?.name === wantedPipette?.name

    const attachedWrong = Boolean(!success && wantedPipette && actualPipette)

    const launchPOC = () => {
      // home before cal flow to account for skips when attaching pipette
      setWizardStep(CALIBRATE_PIPETTE)
      dispatchApiRequests(home(robotName, ROBOT))
      showAskForCalibrationBlock(null)
    }

    if (success && wantedPipette && shouldLevel(wantedPipette)) {
      return (
        <LevelPipette
          {...{
            pipetteModelName: actualPipette ? actualPipette.name : '',
            ...basePropsWithPipettes,
            back: () => setWizardStep(INSTRUCTIONS),
            exit: homePipAndExit,
            actualPipetteOffset: actualPipetteOffset,
            startPipetteOffsetCalibration: launchPOC,
          }}
        />
      )
    } else {
      return (
        <ConfirmPipette
          {...{
            ...basePropsWithPipettes,
            success,
            attachedWrong,
            tryAgain: () => {
              setWantedName(null)
              setWizardStep(INSTRUCTIONS)
            },
            back: () => setWizardStep(INSTRUCTIONS),
            exit: homePipAndExit,
            actualPipetteOffset: actualPipetteOffset,
            startPipetteOffsetCalibration: launchPOC,
          }}
        />
      )
    }
  }

  if (wizardStep === CALIBRATE_PIPETTE) {
    return AskForCalibrationBlockModal || PipetteOffsetCalibrationWizard
  }

  // this will never be reached
  return null
}
