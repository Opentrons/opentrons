import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { getPipetteNameSpecs, shouldLevel } from '@opentrons/shared-data'
import { useTranslation } from 'react-i18next'
import { SPACING } from '@opentrons/components'
import {
  useDispatchApiRequests,
  getRequestById,
  SUCCESS,
  PENDING,
} from '../../redux/robot-api'
import * as Config from '../../redux/config'
import { getCalibrationForPipette } from '../../redux/calibration'
import { getAttachedPipettes } from '../../redux/pipettes'
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
} from '../../redux/robot-controls'

import { INTENT_CALIBRATE_PIPETTE_OFFSET } from '../../organisms/CalibrationPanels'
import { useFeatureFlag } from '../../redux/config'
import { ModalShell } from '../../molecules/Modal'
import { WizardHeader } from '../../molecules/WizardHeader'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import { StyledText } from '../../atoms/text'
import { useCalibratePipetteOffset } from '../CalibratePipetteOffset/useCalibratePipetteOffset'
import { ExitModal } from './ExitModal'
import { Instructions } from './Instructions'
import { ClearDeckModal } from './ClearDeckModal/index'
import { ConfirmPipette } from './ConfirmPipette'
//  remove lines 40 - 46 when removing FF
import { AskForCalibrationBlockModal } from '../CalibrateTipLength/AskForCalibrationBlockModal'
import { ExitAlertModal } from './ExitAlertModal'
import { DeprecatedInstructions } from './DeprecatedInstructions'
import { DeprecatedConfirmPipette } from './DeprecatedConfirmPipette'
import { RequestInProgressModal } from './RequestInProgressModal'
import { DeprecatedLevelPipette } from './DeprecatedLevelPipette'
import { ClearDeckAlertModal } from './ClearDeckModal/ClearDeckAlertModal'

import {
  ATTACH,
  DETACH,
  CLEAR_DECK,
  INSTRUCTIONS,
  CONFIRM,
  CALIBRATE_PIPETTE,
  SINGLE_CHANNEL_STEPS,
  EIGHT_CHANNEL_STEPS,
} from './constants'

import type { State, Dispatch } from '../../redux/types'
import type { Mount } from '../../redux/pipettes/types'
import type { WizardStep } from './types'

interface Props {
  robotName: string
  mount: Mount
  closeModal: () => void
}

// TODO(mc, 2019-12-18): i18n
const PIPETTE_SETUP = 'Pipette Setup'
const MOVE_PIPETTE_TO_FRONT = 'Move pipette to front'
const CANCEL = 'Cancel'
const MOUNT = 'mount'
const PIPETTE_OFFSET_CALIBRATION = 'pipette offset calibration'

export function ChangePipette(props: Props): JSX.Element | null {
  const { robotName, mount, closeModal } = props
  const { t } = useTranslation('change_pipette')
  const history = useHistory()
  const enableChangePipetteWizard = useFeatureFlag('enableChangePipetteWizard')
  const dispatch = useDispatch<Dispatch>()
  const finalRequestId = React.useRef<string | null | undefined>(null)
  const [dispatchApiRequests] = useDispatchApiRequests(dispatchedAction => {
    if (
      dispatchedAction.type === HOME &&
      dispatchedAction.payload.target === PIPETTE
    ) {
      // track final home pipette request, its success closes modal
      // @ts-expect-error(sa, 2021-05-27): avoiding src code change, use in operator to type narrow
      finalRequestId.current = dispatchedAction.meta.requestId
    }
  })
  const [wizardStep, setWizardStep] = React.useState<WizardStep>(CLEAR_DECK)
  const [wantedName, setWantedName] = React.useState<string | null>(null)
  const [confirmExit, setConfirmExit] = React.useState(false)
  // @ts-expect-error(sa, 2021-05-27): avoiding src code change, use in operator to type narrow
  const wantedPipette = wantedName ? getPipetteNameSpecs(wantedName) : null
  const attachedPipette = useSelector(
    (state: State) => getAttachedPipettes(state, robotName)[mount]
  )
  const actualPipette = attachedPipette?.modelSpecs || null
  const actualPipetteOffset = useSelector((state: State) =>
    attachedPipette?.id
      ? getCalibrationForPipette(state, robotName, attachedPipette.id, mount)
      : null
  )

  const movementStatus = useSelector((state: State) => {
    return getMovementStatus(state, robotName)
  })

  const homePipStatus = useSelector((state: State) => {
    return finalRequestId.current
      ? getRequestById(state, finalRequestId.current)
      : null
  })?.status

  React.useEffect(() => {
    if (homePipStatus === SUCCESS) closeModal()
  }, [homePipStatus, closeModal])

  const homePipAndExit = React.useCallback(
    () => dispatchApiRequests(home(robotName, PIPETTE, mount)),
    [dispatchApiRequests, robotName, mount]
  )

  const [
    startPipetteOffsetCalibration,
    PipetteOffsetCalibrationWizard,
  ] = useCalibratePipetteOffset(robotName, { mount }, closeModal)

  const configHasCalibrationBlock = useSelector(Config.getHasCalibrationBlock)
  const [showCalBlockModal, setShowCalBlockModal] = React.useState<boolean>(
    false
  )

  const startPipetteOffsetWizard = (
    hasBlockModalResponse: boolean | null = null
  ): void => {
    if (hasBlockModalResponse === null && configHasCalibrationBlock === null) {
      setShowCalBlockModal(true)
    } else {
      startPipetteOffsetCalibration({
        overrideParams: {
          hasCalibrationBlock: Boolean(
            configHasCalibrationBlock ?? hasBlockModalResponse
          ),
        },
        withIntent: INTENT_CALIBRATE_PIPETTE_OFFSET,
      })
      setShowCalBlockModal(false)
    }
  }

  const baseProps = {
    title: PIPETTE_SETUP,
    subtitle: `${mount} ${MOUNT}`,
    mount,
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
  const [instructionStepPage, instructionSetStepPage] = React.useState<number>(
    0
  )
  const eightChannel = wantedPipette?.channels === 8
  const direction = actualPipette ? DETACH : ATTACH
  const exitModal = (
    <ExitModal
      back={() => setConfirmExit(false)}
      exit={homePipAndExit}
      direction={direction}
    />
  )

  //  this is the logic for the Instructions page that renders 3 pages within the component
  let instructionsCurrentStep: number = SINGLE_CHANNEL_STEPS
  if (wizardStep === INSTRUCTIONS) {
    if (instructionStepPage === 0) {
      instructionsCurrentStep = 1
    } else if (instructionStepPage === 1) {
      instructionsCurrentStep = 2
    } else if (instructionStepPage === 2) {
      instructionsCurrentStep = 3
    }
  }

  let exitWizardHeader
  let wizardTitle: string =
    actualPipette?.displayName != null
      ? t('detach_pipette', {
          pipette: actualPipette.displayName,
          mount: mount[0].toUpperCase() + mount.slice(1),
        })
      : t('attach_pipette')
  let currentStep: number = 0
  let contents: JSX.Element | null = null

  if (movementStatus === MOVING) {
    contents = (
      <InProgressModal>
        <StyledText
          as="h1"
          marginTop={SPACING.spacing5}
          marginBottom={SPACING.spacing3}
        >
          {t('moving_gantry')}
        </StyledText>
      </InProgressModal>
    )
  } else if (wizardStep === CLEAR_DECK) {
    exitWizardHeader = closeModal
    contents = (
      <ClearDeckModal
        onContinueClick={() => {
          dispatch(move(robotName, CHANGE_PIPETTE, mount, true))
          setWizardStep(INSTRUCTIONS)
        }}
      />
    )
  } else if (wizardStep === INSTRUCTIONS) {
    const noPipetteSelectedAttach =
      direction === ATTACH && wantedPipette === null
    const attachWizardHeader = noPipetteSelectedAttach
      ? t('attach_pipette')
      : t('attach_pipette_type', {
          pipetteName: wantedPipette?.displayName ?? '',
        })

    const noPipetteDetach =
      direction === DETACH && actualPipette === null && wantedPipette === null
    const detachWizardHeader = noPipetteDetach
      ? t('detach')
      : t('detach_pipette', {
          pipette: actualPipette?.displayName ?? wantedPipette?.displayName,
          mount: mount[0].toUpperCase() + mount.slice(1),
        })

    let title
    if (instructionStepPage === 2) {
      title = t('attach_pipette_type', {
        pipetteName: wantedPipette?.displayName ?? '',
      })
    } else if (actualPipette?.displayName != null) {
      title = detachWizardHeader
    } else {
      title = attachWizardHeader
    }

    exitWizardHeader = confirmExit ? closeModal : () => setConfirmExit(true)
    currentStep = instructionsCurrentStep
    wizardTitle = title

    contents = confirmExit ? (
      exitModal
    ) : (
      <Instructions
        {...{
          ...basePropsWithPipettes,
          direction,
          setWantedName,
          confirm: () => setWizardStep(CONFIRM),
          back: () => setWizardStep(CLEAR_DECK),
          stepPage: instructionStepPage,
          setStepPage: instructionSetStepPage,
          totalSteps: eightChannel ? EIGHT_CHANNEL_STEPS : SINGLE_CHANNEL_STEPS,
          title:
            actualPipette?.displayName != null
              ? t('detach_pipette', {
                  pipette: actualPipette.displayName,
                  mount: mount[0].toUpperCase() + mount.slice(1),
                })
              : t('attach_pipette'),
        }}
      />
    )
  } else if (wizardStep === CONFIRM) {
    const success =
      // success if we were trying to detach and nothing's attached
      (!actualPipette && !wantedPipette) ||
      // or if the names of wanted and attached match
      actualPipette?.name === wantedPipette?.name

    const attachedIncorrectPipette = Boolean(
      !success && wantedPipette && actualPipette
    )

    const toCalDashboard = (): void => {
      dispatchApiRequests(home(robotName, ROBOT))
      closeModal()
      history.push(`/devices/${robotName}/robot-settings/calibration`)
    }

    currentStep = success
      ? eightChannel
        ? EIGHT_CHANNEL_STEPS
        : SINGLE_CHANNEL_STEPS
      : SINGLE_CHANNEL_STEPS - 1
    exitWizardHeader = success ? homePipAndExit : () => setConfirmExit(true)

    wizardTitle =
      (wantedPipette == null && actualPipette == null) ||
      (wantedPipette == null && actualPipette)
        ? t('detatch_pipette_from_mount', {
            mount: mount[0].toUpperCase() + mount.slice(1),
          })
        : t('attach_name_pipette', {
            pipette: wantedPipette != null ? wantedPipette.displayName : '',
          })

    contents = confirmExit ? (
      exitModal
    ) : (
      <ConfirmPipette
        {...{
          ...basePropsWithPipettes,
          success,
          attachedWrong: attachedIncorrectPipette,
          tryAgain: () => {
            setWantedName(null)
            setWizardStep(INSTRUCTIONS)
          },
          exit: homePipAndExit,
          actualPipetteOffset: actualPipetteOffset,
          toCalibrationDashboard: toCalDashboard,
        }}
      />
    )
  }

  if (enableChangePipetteWizard) {
    return (
      <ModalShell height="28.12rem" width="47rem">
        <WizardHeader
          totalSteps={eightChannel ? EIGHT_CHANNEL_STEPS : SINGLE_CHANNEL_STEPS}
          currentStep={currentStep}
          title={wizardTitle}
          onExit={exitWizardHeader}
        />
        {contents}
      </ModalShell>
    )
  } else {
    //  TODO(Jr, 29.08.22): this whole else can be removed when we remove the FF
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
          (
          <DeprecatedInstructions
            {...{
              ...basePropsWithPipettes,
              direction,
              setWantedName,
              confirm: () => setWizardStep(CONFIRM),
              exit: () => setConfirmExit(true),
            }}
          />
          )
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

      const launchPOC = (): void => {
        // home before cal flow to account for skips when attaching pipette
        setWizardStep(CALIBRATE_PIPETTE)
        dispatchApiRequests(home(robotName, ROBOT))
        startPipetteOffsetWizard()
      }
      if (
        !enableChangePipetteWizard &&
        success &&
        wantedPipette &&
        shouldLevel(wantedPipette)
      ) {
        return (
          <DeprecatedLevelPipette
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
          <DeprecatedConfirmPipette
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
      return showCalBlockModal ? (
        <AskForCalibrationBlockModal
          titleBarTitle={PIPETTE_OFFSET_CALIBRATION}
          onResponse={startPipetteOffsetWizard}
          closePrompt={homePipAndExit}
        />
      ) : (
        PipetteOffsetCalibrationWizard
      )
    }
  }
  // this will never be reached
  return null
}
