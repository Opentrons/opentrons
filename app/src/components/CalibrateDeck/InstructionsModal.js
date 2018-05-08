// @flow
import * as React from 'react'
import {Link} from 'react-router-dom'
import type {CalibrateDeckStartedProps} from './types'

import {ModalPage, SpinnerModalPage} from '@opentrons/components'
import AttachTip from './AttachTip'
import ConfirmPosition from './ConfirmPosition'

type Props = CalibrateDeckStartedProps

const TITLE = 'Deck Calibration'

export default function InstructionsModal (props: Props) {
  const {calibrationStep, exitUrl, moveRequest} = props
  const subtitle = `Step ${calibrationStep} of 6`
  const titleBarBase = {title: TITLE, subtitle}
  const backButtonBase = {children: 'exit'}

  if (moveRequest.inProgress) {
    return (
      <SpinnerModalPage
        titleBar={{
          ...titleBarBase,
          back: {...backButtonBase, disabled: true}
        }}
        message='TODO'
      />
    )
  }

  let StepInstructions

  if (calibrationStep === '1') {
    StepInstructions = AttachTip
  } else if (['2', '3', '4', '5'].indexOf(calibrationStep) > -1) {
    StepInstructions = ConfirmPosition
  } else {
    // TODO(mc, 2018-05-08): RemoveTip
    StepInstructions = 'div'
  }

  return (
    <ModalPage
      titleBar={{
        ...titleBarBase,
        back: {...backButtonBase, Component: Link, to: exitUrl}
      }}
      heading={getHeading(props)}
    >
      <StepInstructions {...props} />
    </ModalPage>
  )
}

function getHeading (props: Props): string {
  const {calibrationStep, mount} = props

  switch (calibrationStep) {
    case '1': return `place tip on ${mount} pipette`

    case '2': return 'calibrate the z-axis'

    case '3':
    case '4':
    case '5':
      return 'calibrate the x-y axes'

    case '6': return 'remove tip from pipette & restart robot'
  }

  return ''
}
