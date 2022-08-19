import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { getPipetteNameSpecs, shouldLevel } from '@opentrons/shared-data'
import { useTranslation } from 'react-i18next'

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

import { useCalibratePipetteOffset } from '../CalibratePipetteOffset/useCalibratePipetteOffset'
import { AskForCalibrationBlockModal } from '../CalibrateTipLength/AskForCalibrationBlockModal'
import { INTENT_CALIBRATE_PIPETTE_OFFSET } from '../../organisms/DeprecatedCalibrationPanels'
import { useFeatureFlag } from '../../redux/config'
import { ModalShell } from '../../molecules/Modal'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import { Instructions } from './Instructions'
import { ClearDeckModal } from './ClearDeckModal/index'
import { ExitAlertModal } from './ExitAlertModal'
import { DeprecatedInstructions } from './DeprecatedInstructions'
import { ConfirmPipette } from './ConfirmPipette'
import { RequestInProgressModal } from './RequestInProgressModal'
import { LevelPipette } from './LevelPipette'
import { DeprecatedLevelPipette } from './DeprecatedLevelPipette'
import { ClearDeckAlertModal } from './ClearDeckModal/ClearDeckAlertModal'

import {
  ATTACH,
  DETACH,
  CLEAR_DECK,
  INSTRUCTIONS,
  CONFIRM,
  CALIBRATE_PIPETTE,
} from './constants'

import { Mount, SPACING } from '@opentrons/components'
import type { State, Dispatch } from '../../redux/types'
import type { WizardStep } from './types'
import { StyledText } from '../../atoms/text'

interface Props {
  robotName: string
  mount: Mount
  closeModal: () => unknown
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

  if (
    movementStatus !== null &&
    //  when FF is removed, change this logic so the modal only appears when movement status is MOVING
    (movementStatus === HOMING || movementStatus === MOVING)
  ) {
    return enableChangePipetteWizard && movementStatus === MOVING ? (
      <ModalShell height="28.12rem" width="47rem">
        <InProgressModal
          wizardHeaderTitle={t('attach_pipette')}
          currentStep={1}
          totalSteps={5}
        >
          <StyledText
            as="h1"
            marginTop={SPACING.spacing5}
            marginBottom={SPACING.spacing3}
          >
            {t('moving_gantry')}
          </StyledText>
        </InProgressModal>
      </ModalShell>
    ) : (
      <RequestInProgressModal
        {...baseProps}
        movementStatus={movementStatus}
        isPipetteHoming={homePipStatus === PENDING}
      />
    )
  }

  if (wizardStep === CLEAR_DECK) {
    return enableChangePipetteWizard ? (
      <ModalShell height="28.12rem" width="47rem">
        <ClearDeckModal
          totalSteps={5}
          currentStep={0}
          title={
            actualPipette?.displayName != null
              ? t('detach_pipette', {
                  pipette: actualPipette.displayName,
                  mount: mount[0].toUpperCase() + mount.slice(1),
                })
              : t('attach_pipette')
          }
          onCancelClick={closeModal}
          onContinueClick={() => {
            dispatch(move(robotName, CHANGE_PIPETTE, mount, true))
            setWizardStep(INSTRUCTIONS)
          }}
        />
      </ModalShell>
    ) : (
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
        {enableChangePipetteWizard ? (
          <ModalShell height="28.12rem" width="47rem">
            <Instructions
              {...{
                ...basePropsWithPipettes,
                direction,
                setWantedName,
                confirm: () => setWizardStep(CONFIRM),
                back: () => setWizardStep(CLEAR_DECK),
                exit: () => setConfirmExit(true),
                currentStep: 5,
                totalSteps: 8,
                title:
                  actualPipette?.displayName != null
                    ? t('detach_pipette', {
                        pipette: actualPipette.displayName,
                        mount: mount[0].toUpperCase() + mount.slice(1),
                      })
                    : t('attach_pipette'),
              }}
            />
          </ModalShell>
        ) : (
          <DeprecatedInstructions
            {...{
              ...basePropsWithPipettes,
              direction,
              setWantedName,
              confirm: () => setWizardStep(CONFIRM),
              exit: () => setConfirmExit(true),
            }}
          />
        )}
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

    if (success && wantedPipette && shouldLevel(wantedPipette)) {
      return enableChangePipetteWizard ? (
        <ModalShell height="28.12rem" width="47rem">
          <LevelPipette
            {...basePropsWithPipettes}
            pipetteModelName={actualPipette ? actualPipette.name : ''}
            exit={() => setConfirmExit(true)}
            confirm={homePipAndExit}
            back={() => setWizardStep(CLEAR_DECK)}
            currentStep={6}
            totalSteps={8}
          />
        </ModalShell>
      ) : (
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

  // this will never be reached
  return null
}
