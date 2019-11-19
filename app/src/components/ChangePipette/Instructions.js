// @flow
import * as React from 'react'
import { Link } from 'react-router-dom'
import capitalize from 'lodash/capitalize'

import { ModalPage } from '@opentrons/components'
import PipetteSelection from './PipetteSelection'
import InstructionStep from './InstructionStep'
import { CheckPipettesButton } from './CheckPipettesButton'
import styles from './styles.css'

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

  const heading = `${capitalize(direction)} ${displayName} Pipette`
  const titleBar = {
    title: props.title,
    subtitle: props.subtitle,
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
        <PipetteSelection onPipetteChange={props.onPipetteSelect} />
      )}

      {(actualPipette || wantedPipette) && (
        <div>
          <Steps {...props} />
          <CheckPipettesButton
            className={styles.check_pipette_button}
            robotName={robot.name}
            onDone={goToConfirmUrl}
          >
            {actualPipette ? DETACH_CONFIRM : ATTACH_CONFIRM}
          </CheckPipettesButton>
        </div>
      )}
    </ModalPage>
  )
}

function Steps(props: ChangePipetteProps) {
  const { direction, displayCategory } = props

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
        displayCategory={displayCategory}
        {...props}
      >
        {stepOne}
      </InstructionStep>
      <InstructionStep
        step="two"
        diagram="tab"
        channels={channels}
        displayCategory={displayCategory}
        {...props}
      >
        {stepTwo}
      </InstructionStep>
    </div>
  )
}
