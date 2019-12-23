// @flow
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import last from 'lodash/last'
import { getPipetteNameSpecs } from '@opentrons/shared-data'

import { useDispatchApiRequest, getRequestById, PENDING } from '../../robot-api'
import { getAttachedPipettes } from '../../pipettes'
import {
  home,
  move,
  getMovementStatus,
  HOMING,
  MOVING,
  PIPETTE,
  CHANGE_PIPETTE,
} from '../../robot-controls'

import ClearDeckAlertModal from '../ClearDeckAlertModal'
import { ExitAlertModal } from './ExitAlertModal'
import { Instructions } from './Instructions'
import { ConfirmPipette } from './ConfirmPipette'
import { RequestInProgressModal } from './RequestInProgressModal'

import { ATTACH, DETACH, CLEAR_DECK, INSTRUCTIONS, CONFIRM } from './constants'

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

export function ChangePipette(props: Props) {
  const { robotName, mount, closeModal } = props
  const dispatch = useDispatch<Dispatch>()
  const [dispatchApiRequest, requestIds] = useDispatchApiRequest()
  const [wizardStep, setWizardStep] = React.useState<WizardStep>(CLEAR_DECK)
  const [wantedName, setWantedName] = React.useState<string | null>(null)
  const [confirmExit, setConfirmExit] = React.useState(false)
  const wantedPipette = wantedName ? getPipetteNameSpecs(wantedName) : null
  const actualPipette = useSelector((state: State) => {
    return getAttachedPipettes(state, robotName)[mount]?.modelSpecs || null
  })

  const movementStatus = useSelector((state: State) => {
    return getMovementStatus(state, robotName)
  })

  const homeRequest = useSelector((state: State) => {
    return getRequestById(state, last(requestIds))
  })?.status

  React.useEffect(() => {
    if (homeRequest && homeRequest !== PENDING) {
      closeModal()
    }
  }, [homeRequest, closeModal])

  const homeAndExit = React.useCallback(
    () => dispatchApiRequest(home(robotName, PIPETTE, mount)),
    [dispatchApiRequest, robotName, mount]
  )

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
      <RequestInProgressModal {...baseProps} movementStatus={movementStatus} />
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
            exit={homeAndExit}
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
      // success if we were trying to detach and nothings attached
      (!actualPipette && !wantedPipette) ||
      // or if the names of wanted and attached match
      actualPipette?.name === wantedPipette?.name

    const attachedWrong = Boolean(!success && wantedPipette && actualPipette)

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
          exit: homeAndExit,
        }}
      />
    )
  }

  // this will never be reached
  return null
}
