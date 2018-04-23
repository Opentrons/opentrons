// @flow
import * as React from 'react'
import {Link} from 'react-router-dom'
import capitalize from 'lodash/capitalize'

import type {ChangePipetteProps} from './types'

import {ModalPage, PrimaryButton, type ButtonProps} from '@opentrons/components'
import PipetteSelection from './PipetteSelection'
import InstructionStep from './InstructionStep'
import styles from './styles.css'

export default function Instructions (props: ChangePipetteProps) {
  const {wantedPipette, actualPipette} = props

  const titleBar = {
    ...props,
    back: wantedPipette
      ? {onClick: props.back}
      : {Component: Link, to: props.exitUrl}
  }

  return (
    <ModalPage titleBar={titleBar} contentsClassName={styles.modal_contents}>
      <Title {...props} />

      {!actualPipette && !wantedPipette && (
        <PipetteSelection onChange={props.onPipetteSelect} />
      )}

      {(actualPipette || wantedPipette) && (
        <div>
          <Steps {...props} />
          <CheckButton onClick={props.confirmPipette} />
        </div>
      )}
    </ModalPage>
  )
}

function Title (props: ChangePipetteProps) {
  const {direction, displayName} = props
  const title = `${capitalize(direction)} ${displayName} Pipette`

  return (
    <h3 className={styles.attach_pipette_title}>
      {title}
    </h3>
  )
}

function Steps (props: ChangePipetteProps) {
  const {direction} = props
  const pipette = props.actualPipette || props.wantedPipette
  let stepOne
  let stepTwo

  if (direction === 'detach') {
    stepOne = 'Loosen screws.'
    stepTwo = (
      <div>
        <p className={styles.step_copy}>
          <strong>Hold on to pipette</strong> so it does not drop.
        </p>
        <p>
          Disconnect the pipette from robot by pulling the white connector tab.
        </p>
      </div>
    )
  } else {
    stepOne = (
      <p>
        Attach pipette to carriage, <strong>starting with screw 1</strong>.
      </p>
    )
    stepTwo = 'Connect the pipette to robot by pushing in the white connector tab.'
  }

  return (
    <div className={styles.instructions}>
      <InstructionStep
        step='one'
        diagram='screws'
        {...props}
        {...pipette}
      >
        {stepOne}
      </InstructionStep>
      <InstructionStep
        step='two'
        diagram='tab'
        {...props}
        {...pipette}
      >
        {stepTwo}
      </InstructionStep>
    </div>
  )
}

function CheckButton (props: ButtonProps) {
  return (
    <PrimaryButton
      {...props}
      className={styles.check_pipette_button}
    >
      have robot check connection
    </PrimaryButton>
  )
}
