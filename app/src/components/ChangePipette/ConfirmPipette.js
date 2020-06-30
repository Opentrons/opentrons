// @flow
import * as React from 'react'
import cx from 'classnames'

import { Icon, PrimaryButton, ModalPage } from '@opentrons/components'
import type {
  PipetteNameSpecs,
  PipetteModelSpecs,
  PipetteDisplayCategory,
} from '@opentrons/shared-data'
import type { Mount } from '../../pipettes/types'
import { getDiagramsSrc } from './InstructionStep'
import { CheckPipettesButton } from './CheckPipettesButton'
import styles from './styles.css'

const EXIT_BUTTON_MESSAGE = 'exit pipette setup'
const EXIT_BUTTON_MESSAGE_WRONG = 'keep pipette and exit setup'

type Props = {|
  robotName: string,
  mount: Mount,
  title: string,
  subtitle: string,
  success: boolean,
  attachedWrong: boolean,
  wantedPipette: PipetteNameSpecs | null,
  actualPipette: PipetteModelSpecs | null,
  displayName: string,
  displayCategory: PipetteDisplayCategory | null,
  tryAgain: () => mixed,
  back: () => mixed,
  exit: () => mixed,
|}

export function ConfirmPipette(props: Props): React.Node {
  const { title, subtitle, success, attachedWrong, actualPipette, back } = props

  return (
    <ModalPage
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
      <ExitButton {...props} />
    </ModalPage>
  )
}

function Status(props: Props) {
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

function StatusDetails(props: Props) {
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

function AttachAnotherButton(props: Props) {
  return (
    <PrimaryButton className={styles.confirm_button} onClick={props.back}>
      attach another pipette
    </PrimaryButton>
  )
}

function TryAgainButton(props: Props) {
  const {
    robotName,
    attachedWrong,
    wantedPipette,
    actualPipette,
    tryAgain,
  } = props

  if (wantedPipette && attachedWrong) {
    return (
      <PrimaryButton className={styles.confirm_button} onClick={tryAgain}>
        detach and try again
      </PrimaryButton>
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

function ExitButton(props: Props) {
  const { exit, attachedWrong } = props
  const children = attachedWrong
    ? EXIT_BUTTON_MESSAGE_WRONG
    : EXIT_BUTTON_MESSAGE

  return (
    <PrimaryButton className={styles.confirm_button} onClick={exit}>
      {children}
    </PrimaryButton>
  )
}
