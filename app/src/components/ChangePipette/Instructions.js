// @flow
import * as React from 'react'
import { Link } from 'react-router-dom'
import capitalize from 'lodash/capitalize'

import { ModalPage, PrimaryButton } from '@opentrons/components'
import PipetteSelection from './PipetteSelection'
import InstructionStep from './InstructionStep'
import styles from './styles.css'

import type { ButtonProps } from '@opentrons/components'
import type { RobotApiRequestState } from '../../robot-api'
import type { ChangePipetteProps } from './types'

const ATTACH_CONFIRM = 'have robot check connection'
const DETACH_CONFIRM = 'confirm pipette is detached'

export default function Instructions(props: ChangePipetteProps) {
  const {
    wantedPipette,
    actualPipette,
    checkRequest,
    direction,
    displayName,
    goToConfirmUrl,
  } = props

  // useRef rather than useState because this does not affect the render
  const checking = React.useRef(false)
  const prevCheckRequest = React.useRef<RobotApiRequestState | null>(null)

  // TODO(mc, 2019-05-15): figure out how to extract to "do something when
  // request resolves" hook or something
  React.useEffect(() => {
    const prevResponse = prevCheckRequest.current?.response
    const nextResponse = checkRequest?.response

    if (
      checking.current &&
      prevCheckRequest.current &&
      !prevResponse &&
      nextResponse
    ) {
      checking.current = false
      goToConfirmUrl()
    }

    prevCheckRequest.current = checkRequest
  }, [checkRequest, goToConfirmUrl])

  const heading = `${capitalize(direction)} ${displayName} Pipette`
  const titleBar = {
    ...props,
    back: wantedPipette
      ? { onClick: props.back }
      : { Component: Link, to: props.exitUrl, children: 'exit' },
  }

  const checkPipette = () => {
    props.checkPipette()
    checking.current = true
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
