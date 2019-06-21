// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import capitalize from 'lodash/capitalize'

import { ModalPage, PrimaryButton } from '@opentrons/components'
import {
  getPipettesRequestState,
  useTriggerRobotApiAction,
} from '../../robot-api'
import PipetteSelection from './PipetteSelection'
import InstructionStep from './InstructionStep'
import styles from './styles.css'

import type { ButtonProps } from '@opentrons/components'
import type { ChangePipetteProps } from './types'

const ATTACH_CONFIRM = 'have robot check connection'
const DETACH_CONFIRM = 'confirm pipette is detached'

export default function Instructions(props: ChangePipetteProps) {
  const {
    robot,
    wantedPipette,
    actualPipette,
    setWantedName,
    direction,
    displayName,
    goToConfirmUrl,
  } = props

  // TODO(mc, 2019-06-19): move these up when parent uses hooks
  const requestState = useSelector(state =>
    getPipettesRequestState(state, robot.name)
  )
  const checkPipette = useTriggerRobotApiAction(
    props.checkPipette,
    requestState,
    { onFinish: goToConfirmUrl }
  )

  const heading = `${capitalize(direction)} ${displayName} Pipette`
  const titleBar = {
    ...props,
    back: wantedPipette
      ? { onClick: () => setWantedName(null) }
      : { Component: Link, to: props.exitUrl, children: 'exit' },
  }

  return (
    <ModalPage
      titleBar={titleBar}
      heading={heading}
      contentsClassName={styles.modal_contents}
    >
      {!actualPipette && !wantedPipette && (
        <PipetteSelection
          onChange={props.onPipetteSelect}
          __pipettePlusEnabled={props.__pipettePlusEnabled}
        />
      )}

      {(actualPipette || wantedPipette) && (
        <div>
          <Steps {...props} />
          <CheckButton onClick={checkPipette}>
            {actualPipette ? DETACH_CONFIRM : ATTACH_CONFIRM}
          </CheckButton>
        </div>
      )}
    </ModalPage>
  )
}

function Steps(props: ChangePipetteProps) {
  const { direction } = props
  const channels = props.actualPipette
    ? props.actualPipette.channels
    : props.wantedPipette?.channels || 1

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
    stepTwo =
      'Connect the pipette to robot by pushing in the white connector tab.'
  }

  return (
    <div className={styles.instructions}>
      <InstructionStep
        step="one"
        diagram="screws"
        channels={channels}
        {...props}
      >
        {stepOne}
      </InstructionStep>
      <InstructionStep step="two" diagram="tab" channels={channels} {...props}>
        {stepTwo}
      </InstructionStep>
    </div>
  )
}

function CheckButton(props: ButtonProps) {
  return <PrimaryButton {...props} className={styles.check_pipette_button} />
}
