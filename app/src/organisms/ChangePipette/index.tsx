import * as React from 'react'
import capitalize from 'lodash/capitalize'
import { useSelector, useDispatch } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getPipetteNameSpecs, PipetteNameSpecs } from '@opentrons/shared-data'
import { SPACING, TYPOGRAPHY } from '@opentrons/components'

import {
  useDispatchApiRequests,
  getRequestById,
  SUCCESS,
} from '../../redux/robot-api'
import { getCalibrationForPipette } from '../../redux/calibration'
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

import { LegacyModalShell } from '../../molecules/LegacyModal'
import { WizardHeader } from '../../molecules/WizardHeader'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import { StyledText } from '../../atoms/text'
import { useAttachedPipettes } from '../Devices/hooks'
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
  const [currentStepCount, setCurrentStepCount] = React.useState(0)
  // @ts-expect-error(sa, 2021-05-27): avoiding src code change, use in operator to type narrow
  const wantedPipette = wantedName ? getPipetteNameSpecs(wantedName) : null
  const attachedPipette = useAttachedPipettes()[mount]
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

  let direction
  if (currentStepCount === 0) {
    direction = actualPipette != null ? DETACH : ATTACH
  } else {
    direction = wantedPipette != null ? ATTACH : DETACH
  }
  let eightChannel = wantedPipette?.channels === 8
  // if the user selects a single channel but attaches and accepts an 8 channel
  if (actualPipette != null && currentStepCount >= 3 && direction === ATTACH) {
    eightChannel = actualPipette?.channels === 8
  }

  const isButtonDisabled =
    movementStatus === HOMING || movementStatus === MOVING

  const exitModal = (
    <ExitModal
      back={() => setConfirmExit(false)}
      isDisabled={isButtonDisabled}
      exit={homePipAndExit}
      direction={direction}
    />
  )

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
    actualPipette?.displayName != null &&
    wantedPipette === null &&
    direction === DETACH
      ? t('detach_pipette', {
          pipette: actualPipette.displayName,
          mount: capitalize(mount),
        })
      : t('attach_pipette')

  let contents: JSX.Element | null = null

  if (movementStatus === MOVING) {
    contents = (
      <InProgressModal>
        <StyledText
          css={TYPOGRAPHY.h1Default}
          marginTop={SPACING.spacing24}
          marginBottom={SPACING.spacing8}
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

    let title
    if (currentStepCount === 3) {
      title = t('attach_pipette_type', {
        pipetteName: wantedPipette?.displayName ?? '',
      })
    } else if (actualPipette?.displayName != null) {
      title = noPipetteDetach
        ? t('detach')
        : t('detach_pipette', {
            pipette: actualPipette?.displayName ?? wantedPipette?.displayName,
            mount: capitalize(mount),
          })
    } else {
      title = noPipetteSelectedAttach
        ? t('attach_pipette')
        : t('attach_pipette_type', {
            pipetteName: wantedPipette?.displayName ?? '',
          })
    }

    exitWizardHeader = confirmExit ? undefined : () => setConfirmExit(true)
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
          currentStepCount,
          nextStep: () => setCurrentStepCount(currentStepCount + 1),
          prevStep: () => setCurrentStepCount(currentStepCount - 1),
          totalSteps: eightChannel ? EIGHT_CHANNEL_STEPS : SINGLE_CHANNEL_STEPS,
          title:
            actualPipette?.displayName != null
              ? t('detach_pipette', {
                  pipette: actualPipette.displayName,
                  mount: capitalize(mount),
                })
              : t('attach_pipette'),
        }}
      />
    )
  } else if (wizardStep === CONFIRM) {
    const toCalDashboard = (): void => {
      dispatchApiRequests(home(robotName, ROBOT))
      closeModal()
      history.push(`/devices/${robotName}/robot-settings/calibration/dashboard`)
    }

    exitWizardHeader =
      success || confirmExit ? undefined : () => setConfirmExit(true)

    let wizardTitleConfirmPipette
    if (wantedPipette == null && actualPipette == null) {
      wizardTitleConfirmPipette = t('detach_pipette_from_mount', {
        mount: capitalize(mount),
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
            setWizardStep(INSTRUCTIONS)
            setCurrentStepCount(currentStepCount - 1)
          },
          nextStep: () => setCurrentStepCount(currentStepCount + 1),
          wrongWantedPipette: wrongWantedPipette,
          setWrongWantedPipette: setWrongWantedPipette,
          setConfirmPipetteLevel: setConfirmPipetteLevel,
          confirmPipetteLevel: confirmPipetteLevel,
          exit: homePipAndExit,
          actualPipetteOffset: actualPipetteOffset,
          toCalibrationDashboard: toCalDashboard,
          isDisabled: isButtonDisabled,
        }}
      />
    )
  }
  return (
    <LegacyModalShell width="42.375rem">
      <WizardHeader
        totalSteps={eightChannel ? EIGHT_CHANNEL_STEPS : SINGLE_CHANNEL_STEPS}
        currentStep={currentStepCount}
        title={wizardTitle}
        onExit={exitWizardHeader}
      />
      {contents}
    </LegacyModalShell>
  )
}
