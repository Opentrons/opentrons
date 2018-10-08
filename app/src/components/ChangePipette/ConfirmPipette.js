// @flow
import * as React from 'react'
import cx from 'classnames'
import {Link} from 'react-router-dom'

import {Icon, PrimaryButton, ModalPage} from '@opentrons/components'
import {getPipetteChannelsByName} from '@opentrons/shared-data'

import type {ChangePipetteProps} from './types'
import {getDiagramSrc} from './InstructionStep'
import styles from './styles.css'

const EXIT_BUTTON_MESSAGE = 'exit pipette setup'
const EXIT_BUTTON_MESSAGE_WRONG = 'keep pipette and exit setup'

// note: direction prop is not valid inside this component
// display messages based on presence of wantedPipetteName and actualPipette
export default function ConfirmPipette (props: ChangePipetteProps) {
  const {success, attachedWrong, actualPipette} = props

  return (
    <ModalPage
      titleBar={{
        title: props.title,
        subtitle: props.subtitle,
        back: {
          onClick: props.back,
          disabled: success || attachedWrong,
        },
      }}
    >
      <Status {...props} />
      <StatusDetails {...props} />
      {!success && (
        <TryAgainButton {...props} />
      )}
      {success && !actualPipette && (
        <AttachAnotherButton {...props} />
      )}
      <ExitButton {...props} />
    </ModalPage>
  )
}

function Status (props: ChangePipetteProps) {
  const {displayName, wantedPipetteName, attachedWrong, success} = props
  const iconName = success ? 'check-circle' : 'close-circle'
  const iconClass = cx(styles.confirm_icon, {
    [styles.success]: success,
    [styles.failure]: !success,
  })

  let message

  if (wantedPipetteName && success) {
    message = `${displayName} successfully attached.`
  } else if (wantedPipetteName) {
    message = attachedWrong
      ? `Incorrect pipette attached (${displayName})`
      : `Unable to detect ${wantedPipetteName || ''}.`
  } else {
    message = success
      ? 'Pipette is detached'
      : 'Pipette is not detached'
  }

  return (
    <div className={styles.confirm_status}>
      <Icon name={iconName} className={iconClass} />
      {message}
    </div>
  )
}

function StatusDetails (props: ChangePipetteProps) {
  const {success, attachedWrong, wantedPipetteName, actualPipette} = props

  if (!success) {
    if (wantedPipetteName && attachedWrong) {
      return (
        <p className={styles.confirm_failure_instructions}>
          The attached pipette does not match the {wantedPipetteName} pipette you had originally selected.
        </p>
      )
    }

    if (wantedPipetteName) {
      return (
        <div>
          <img
            className={styles.confirm_diagram}
            src={getDiagramSrc({
              ...props,
              channels: getPipetteChannelsByName(wantedPipetteName),
              diagram: 'tab',
              direction: 'attach',
            })}
          />
          <p className={styles.confirm_failure_instructions}>
            Check again to ensure that white connector tab is plugged into pipette.
          </p>
        </div>
      )
    }

    if (actualPipette) {
      return (
        <p className={styles.confirm_failure_instructions}>
          Check again to ensure that pipette is unplugged and entirely detached from robot.
        </p>
      )
    }
  }

  return null
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

function TryAgainButton (props: ChangePipetteProps) {
  const {
    baseUrl,
    checkPipette,
    attachedWrong,
    wantedPipetteName,
    actualPipette,
  } = props

  let buttonProps

  if (wantedPipetteName && attachedWrong) {
    buttonProps = {
      Component: Link,
      to: baseUrl.replace(`/${wantedPipetteName}`, ''),
      children: 'detach and try again',
    }
  } else if (actualPipette) {
    buttonProps = {
      onClick: checkPipette,
      children: 'confirm pipette is detached',
    }
  } else {
    buttonProps = {
      onClick: checkPipette,
      children: 'have robot check connection again',
    }
  }

  return (
    <PrimaryButton {...buttonProps} className={styles.confirm_button} />
  )
}

function ExitButton (props: ChangePipetteProps) {
  const {exit, attachedWrong} = props
  const children = attachedWrong
    ? EXIT_BUTTON_MESSAGE_WRONG
    : EXIT_BUTTON_MESSAGE

  return (
    <PrimaryButton
      className={styles.confirm_button}
      onClick={exit}
    >
      {children}
    </PrimaryButton >
  )
}
