// @flow
import * as React from 'react'
import {Link} from 'react-router-dom'
import capitalize from 'lodash/capitalize'

import type {ChangePipetteProps} from './types'

import {getPipetteChannelsByName} from '@opentrons/shared-data'
import {ModalPage, PrimaryButton, type ButtonProps} from '@opentrons/components'
import PipetteSelection from './PipetteSelection'
import InstructionStep from './InstructionStep'
import styles from './styles.css'

const ATTACH_CONFIRM = 'have robot check connection'
const DETACH_CONFIRM = 'confirm pipette is detached'

export default function Instructions (props: ChangePipetteProps) {
  const {wantedPipetteName, actualPipette, direction, displayName} = props

  const titleBar = {
    ...props,
    back: wantedPipetteName
      ? {onClick: props.back}
      : {Component: Link, to: props.exitUrl, children: 'exit'},
  }

  const heading = `${capitalize(direction)} ${displayName} Pipette`

  return (
    <ModalPage
      titleBar={titleBar}
      heading={heading}
      contentsClassName={styles.modal_contents}
    >

      {!actualPipette && !wantedPipetteName && (
        <PipetteSelection onChange={props.onPipetteSelect} />
      )}

      {(actualPipette || wantedPipetteName) && (
        <div>
          <Steps {...props} />
          <CheckButton onClick={props.confirmPipette}>
            {actualPipette ? DETACH_CONFIRM : ATTACH_CONFIRM}
          </CheckButton>
        </div>
      )}
    </ModalPage>
  )
}

function Steps (props: ChangePipetteProps) {
  const {direction} = props
  const channels = props.actualPipette
    ? props.actualPipette.channels
    : getPipetteChannelsByName(props.wantedPipetteName)

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
        Attach pipette to mount, <strong>starting with screw 1</strong>.
      </p>
    )
    stepTwo = 'Connect the pipette to robot by pushing in the white connector tab.'
  }

  return (
    <div className={styles.instructions}>
      <InstructionStep
        step='one'
        diagram='screws'
        channels={channels}
        {...props}
      >
        {stepOne}
      </InstructionStep>
      <InstructionStep
        step='two'
        diagram='tab'
        channels={channels}
        {...props}
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
    />
  )
}
