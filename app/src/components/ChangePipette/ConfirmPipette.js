// @flow
import * as React from 'react'
import cx from 'classnames'
import {Link} from 'react-router-dom'

import {Icon, PrimaryButton, ModalPage} from '@opentrons/components'

import type {ChangePipetteProps} from './types'
import {getDiagramSrc} from './InstructionStep'
import styles from './styles.css'

const EXIT_BUTTON_MESSAGE = 'exit pipette setup'

// note: direction prop is not valid inside this component
// display messages based on presence of wantedPipette and actualPipette
export default function ConfirmPipette (props: ChangePipetteProps) {
  const {success, wantedPipette, actualPipette} = props
  let exitButtonProps = {className: styles.confirm_button}

  exitButtonProps = success
    ? {...exitButtonProps, onClick: props.exit}
    : {...exitButtonProps, Component: Link, to: props.exitUrl}

  return (
    <ModalPage
      titleBar={{
        title: props.title,
        subtitle: props.subtitle,
        back: {onClick: props.back, disabled: !!success}
      }}
    >
      <Status {...props} />
      {!success && wantedPipette && (
        <FailureToDetect {...props} />
      )}
      {!success && (
        <CheckAgainButton {...props} />
      )}
      {success && !actualPipette && (
        <AttachAnotherButton {...props} />
      )}
      <PrimaryButton {...exitButtonProps}>
        {EXIT_BUTTON_MESSAGE}
      </PrimaryButton>
    </ModalPage>
  )
}

function Status (props: ChangePipetteProps) {
  const {displayName, wantedPipette, success} = props
  const iconName = success ? 'check-circle' : 'close-circle'
  const iconClass = cx(styles.confirm_icon, {
    [styles.success]: success,
    [styles.failure]: !success
  })

  let message

  if (wantedPipette) {
    message = success
     ? `${displayName} successfully attached.`
     : `Unable to detect ${wantedPipette.displayName || ''}.`
  } else {
    message = success
      ? 'Pipette is detached'
      : `${displayName} is still attached`
  }

  return (
    <div className={styles.confirm_status}>
      <Icon name={iconName} className={iconClass} />
      {message}
    </div>
  )
}

function FailureToDetect (props: ChangePipetteProps) {
  return (
    <div>
      <img
        className={styles.confirm_diagram}
        src={getDiagramSrc({
          ...props,
          ...props.wantedPipette,
          diagram: 'tab',
          direction: 'attach'
        })}
      />
      <p className={styles.confirm_failure_instructions}>
        Check again to ensure that white connector tab is plugged into pipette.
      </p>
    </div>
  )
}

function AttachAnotherButton (props: ChangePipetteProps) {
  return (
    <PrimaryButton
      className={styles.confirm_button}
      Component={Link}
      to={props.baseUrl}
    >
      attach another pipette
    </PrimaryButton>
  )
}

function CheckAgainButton (props: ChangePipetteProps) {
  return (
    <PrimaryButton
      className={styles.confirm_button}
      onClick={props.checkPipette}
    >
      have robot check connection again
    </PrimaryButton>
  )
}
