import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { getPipetteNameSpecs, PipetteNameSpecs } from '@opentrons/shared-data'
import { useTranslation } from 'react-i18next'
import { SPACING, TYPOGRAPHY } from '@opentrons/components'
import {
  useDispatchApiRequests,
  getRequestById,
  SUCCESS,
} from '../../redux/robot-api'
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

import { ModalShell } from '../../molecules/Modal'
import { WizardHeader } from '../../molecules/WizardHeader'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import { StyledText } from '../../atoms/text'
import { ExitModal } from './ExitModal'
import { Instructions } from './Instructions'
import { ConfirmPipette } from './ConfirmPipette'
import { ClearDeckModal } from './ClearDeckModal'

import {
  ATTACH,
  DETACH,
  CLEAR_DECK,
  INSTRUCTIONS,
  CONFIRM,
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

export function ChangePipette(props: Props): JSX.Element | null {
  const { robotName, mount, closeModal } = props
  const { t } = useTranslation('change_pipette')
  const history = useHistory()
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
  const [
    wrongWantedPipette,
    setWrongWantedPipette,
  ] = React.useState<PipetteNameSpecs | null>(wantedPipette)
  const [confirmPipetteLevel, setConfirmPipetteLevel] = React.useState<boolean>(
    false
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

  const baseProps = {
    title: t('pipette_setup'),
    subtitle: t('mount', { mount: mount }),
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
  const isSelectPipetteStep =
    direction === ATTACH && wantedName === null && wizardStep === INSTRUCTIONS

  const exitModal = (
    <ExitModal
      back={() => setConfirmExit(false)}
      exit={
        movementStatus !== HOMING && movementStatus !== MOVING
          ? homePipAndExit
          : () => console.log('Gantry is moving')
      }
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

  const success =
    // success if we were trying to detach and nothing's attached
    (!actualPipette && !wantedPipette) ||
    // or if the names of wanted and attached match
    actualPipette?.name === wantedPipette?.name

  const attachedIncorrectPipette = Boolean(
    !success && wantedPipette && actualPipette
  )

  const noPipetteDetach =
    direction === DETACH && actualPipette === null && wantedPipette === null

  let exitWizardHeader
  let wizardTitle: string =
    actualPipette?.displayName != null && wantedPipette === null
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
          css={TYPOGRAPHY.h1Default}
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

    exitWizardHeader = confirmExit ? undefined : () => setConfirmExit(true)
    currentStep = instructionsCurrentStep
    wizardTitle = title

    contents = confirmExit ? (
      exitModal
    ) : (
      <Instructions
        {...{
          ...basePropsWithPipettes,
          attachedWrong: attachedIncorrectPipette,
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
    const toCalDashboard = (): void => {
      dispatchApiRequests(home(robotName, ROBOT))
      closeModal()
      history.push(`/devices/${robotName}/robot-settings/calibration`)
    }

    let wizardCurrentStep: number = 0
    //  if success is true OR the wrong pipette was attached and wanted and it is not on the LevelPipette screen
    if (success || (wrongWantedPipette != null && confirmPipetteLevel)) {
      wizardCurrentStep = eightChannel
        ? EIGHT_CHANNEL_STEPS
        : SINGLE_CHANNEL_STEPS
      //  if wrong pipette is attached and wanted and is an 8 channel on the LevelPipette screen
    } else if (wrongWantedPipette != null && !confirmPipetteLevel) {
      wizardCurrentStep = EIGHT_CHANNEL_STEPS - 1
      //  if in error state
    } else {
      wizardCurrentStep = SINGLE_CHANNEL_STEPS - 1
    }

    currentStep = wizardCurrentStep
    exitWizardHeader =
      success || confirmExit ? undefined : () => setConfirmExit(true)

    let wizardTitleConfirmPipette
    if (wantedPipette == null && actualPipette == null) {
      wizardTitleConfirmPipette = t('detach_pipette_from_mount', {
        mount: mount[0].toUpperCase() + mount.slice(1),
      })
    } else if (wantedPipette == null && actualPipette != null) {
      wizardTitleConfirmPipette = t('detach')
    } else {
      wizardTitleConfirmPipette = t('attach_name_pipette', {
        pipette:
          wrongWantedPipette != null
            ? wrongWantedPipette.displayName
            : wantedPipette?.displayName,
      })
    }
    wizardTitle = wizardTitleConfirmPipette

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
          wrongWantedPipette: wrongWantedPipette,
          setWrongWantedPipette: setWrongWantedPipette,
          setConfirmPipetteLevel: setConfirmPipetteLevel,
          confirmPipetteLevel: confirmPipetteLevel,
          exit: homePipAndExit,
          actualPipetteOffset: actualPipetteOffset,
          toCalibrationDashboard: toCalDashboard,
        }}
      />
    )
  }
  return (
    <ModalShell width="42.375rem">
      <WizardHeader
        totalSteps={eightChannel ? EIGHT_CHANNEL_STEPS : SINGLE_CHANNEL_STEPS}
        currentStep={
          // TODO (BC, 2022-09-13): the logic that calculates the current step is very complex, reduce it to a util for clarity and testing
          !success && wizardStep === CONFIRM
            ? null
            : isSelectPipetteStep
            ? 0
            : currentStep
        }
        title={wizardTitle}
        onExit={exitWizardHeader}
      />
      {contents}
    </ModalShell>
  )
}
