import * as React from 'react'
import cx from 'classnames'

import {
  Icon,
  PrimaryBtn,
  DeprecatedModalPage,
  SPACING_2,
} from '@opentrons/components'
import { getDiagramsSrc } from './InstructionStep'
import { CheckPipettesButton } from './CheckPipettesButton'
import styles from './styles.css'

import type {
  PipetteNameSpecs,
  PipetteModelSpecs,
  PipetteDisplayCategory,
} from '@opentrons/shared-data'
import type { Mount } from '../../redux/pipettes/types'
import type { PipetteOffsetCalibration } from '../../redux/calibration/types'

const EXIT_BUTTON_MESSAGE = 'exit pipette setup'
const EXIT_BUTTON_MESSAGE_WRONG = 'keep pipette and exit setup'
const EXIT_WITHOUT_CAL = 'exit without calibrating'
const CONTINUE_TO_PIP_OFFSET = 'continue to pipette offset calibration'

export interface Props {
  robotName: string
  mount: Mount
  title: string
  subtitle: string
  success: boolean
  attachedWrong: boolean
  wantedPipette: PipetteNameSpecs | null
  actualPipette: PipetteModelSpecs | null
  actualPipetteOffset: PipetteOffsetCalibration | null
  displayName: string
  displayCategory: PipetteDisplayCategory | null
  tryAgain: () => unknown
  back: () => unknown
  exit: () => unknown
  startPipetteOffsetCalibration: () => void
}

export function ConfirmPipette(props: Props): JSX.Element {
  const {
    title,
    subtitle,
    success,
    attachedWrong,
    actualPipette,
    actualPipetteOffset,
    back,
  } = props

  return (
    <DeprecatedModalPage
      titleBar={{
        title: title,
        subtitle: subtitle,
        back: { onClick: back, disabled: success || attachedWrong },
      }}
    >
      <Status {...props} />
      <StatusDetails {...props} />
      {!success && <TryAgainButton {...props} />}
      {success && !actualPipette && <AttachAnotherButton {...props} />}
      {success && actualPipette && !actualPipetteOffset && (
        <CalibratePipetteOffsetButton {...props} />
      )}
      <ExitButton {...props} />
    </DeprecatedModalPage>
  )
}

function Status(props: Props): JSX.Element {
  const { displayName, wantedPipette, attachedWrong, success } = props
  const iconName = success ? 'check-circle' : 'close-circle'
  const iconClass = cx(styles.confirm_icon, {
    [styles.success]: success,
    [styles.failure]: !success,
  })

  let message

  if (wantedPipette && success) {
    message = `${wantedPipette.displayName} successfully attached.`
  } else if (wantedPipette) {
    message = attachedWrong
      ? `Incorrect pipette attached (${displayName})`
      : `Unable to detect ${wantedPipette.displayName || ''}.`
  } else {
    message = success ? 'Pipette is detached' : 'Pipette is not detached'
  }

  return (
    <div className={styles.confirm_status}>
      <Icon name={iconName} className={iconClass} />
      {message}
    </div>
  )
}

function StatusDetails(props: Props): JSX.Element | null {
  const {
    mount,
    displayCategory,
    success,
    attachedWrong,
    wantedPipette,
    actualPipette,
  } = props

  if (!success) {
    if (wantedPipette && attachedWrong) {
      return (
        <p className={styles.confirm_failure_instructions}>
          The attached pipette does not match the {wantedPipette.displayName}{' '}
          pipette you had originally selected.
        </p>
      )
    }

    if (wantedPipette) {
      return (
        <div>
          <img
            className={styles.confirm_diagram}
            src={getDiagramsSrc({
              mount,
              displayCategory,
              channels: wantedPipette.channels,
              diagram: 'tab',
              direction: 'attach',
            })}
          />
          <p className={styles.confirm_failure_instructions}>
            Check again to ensure that white connector tab is plugged into
            pipette.
          </p>
        </div>
      )
    }

    if (actualPipette) {
      return (
        <p className={styles.confirm_failure_instructions}>
          Check again to ensure that pipette is unplugged and entirely detached
          from robot.
        </p>
      )
    }
  }

  return null
}

function AttachAnotherButton(props: Props): JSX.Element {
  return (
    <PrimaryBtn marginBottom={SPACING_2} width="100%" onClick={props.back}>
      attach another pipette
    </PrimaryBtn>
  )
}

function CalibratePipetteOffsetButton(props: Props): JSX.Element {
  return (
    <PrimaryBtn
      marginBottom={SPACING_2}
      width="100%"
      onClick={props.startPipetteOffsetCalibration}
    >
      {CONTINUE_TO_PIP_OFFSET}
    </PrimaryBtn>
  )
}

function TryAgainButton(props: Props): JSX.Element {
  const {
    robotName,
    attachedWrong,
    wantedPipette,
    actualPipette,
    tryAgain,
  } = props

  if (wantedPipette && attachedWrong) {
    return (
      <PrimaryBtn marginBottom={SPACING_2} width="100%" onClick={tryAgain}>
        detach and try again
      </PrimaryBtn>
    )
  }

  return (
    <CheckPipettesButton
      className={styles.confirm_button}
      robotName={robotName}
    >
      {actualPipette
        ? 'confirm pipette is detached'
        : 'have robot check connection again'}
    </CheckPipettesButton>
  )
}

const exitButtonMessage: (props: Props) => string = props => {
  const { attachedWrong, actualPipette, actualPipetteOffset, success } = props
  if (success && actualPipette && !Boolean(actualPipetteOffset)) {
    return EXIT_WITHOUT_CAL
  }
  if (attachedWrong) {
    return EXIT_BUTTON_MESSAGE_WRONG
  }
  return EXIT_BUTTON_MESSAGE
}

function ExitButton(props: Props): JSX.Element {
  const { exit } = props
  const buttonText = exitButtonMessage(props)

  return (
    <PrimaryBtn marginBottom={SPACING_2} width="100%" onClick={exit}>
      {buttonText}
    </PrimaryBtn>
  )
}
