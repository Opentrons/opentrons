// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {push} from 'react-router-redux'
import {Link} from 'react-router-dom'
import capitalize from 'lodash/capitalize'

import type {CalibrateDeckStartedProps} from './types'

import {
  restartRobotServer,
  deckCalibrationCommand as dcCommand
} from '../../http-api-client'

import {ModalPage, SpinnerModalPage} from '@opentrons/components'
import AttachTip from './AttachTip'
import ConfirmPosition from './ConfirmPosition'

type OP = CalibrateDeckStartedProps

type DP = {
  proceed: () => mixed
}

type Props = OP & DP

const TITLE = 'Deck Calibration'

export default connect(null, mapDispatchToProps)(InstructionsModal)

function InstructionsModal (props: Props) {
  const {calibrationStep, exitUrl, commandRequest} = props
  const subtitle = `Step ${calibrationStep} of 6`
  const titleBarBase = {title: TITLE, subtitle}
  const backButtonBase = {children: 'exit'}

  if (
    commandRequest.inProgress &&
    commandRequest.request &&
    commandRequest.request.command === 'move'
  ) {
    return (
      <SpinnerModalPage
        titleBar={{
          ...titleBarBase,
          back: {...backButtonBase, disabled: true}
        }}
        message={getMovementDescription(props)}
      />
    )
  }

  let StepInstructions

  if (calibrationStep === '1') {
    StepInstructions = AttachTip
  } else if (['2', '3', '4', '5'].indexOf(calibrationStep) > -1) {
    StepInstructions = ConfirmPosition
  } else {
    StepInstructions = AttachTip
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
    case '6': return 'remove tip from pipette & restart robot'
  }

  return 'calibrate the x-y axes'
}

function getMovementDescription (props: Props): string {
  const {commandRequest} = props
  const mount = capitalize(props.mount)

  switch (
    commandRequest.request &&
    commandRequest.request.command === 'move' &&
    commandRequest.request.point
  ) {
    case 'attachTip': return `${mount} pipette moving to the front and down.`
    case 'safeZ': return `${mount} pipette moving to slot 5.`
    case '1': return `${mount} pipette moving to slot 1.`
    case '2': return `${mount} pipette moving to slot 3.`
    case '3': return `${mount} pipette moving to slot 7.`
  }

  return ''
}

function mapDispatchToProps (dispatch: Dispatch, ownProps: OP): DP {
  const {robot, pipette, calibrationStep: step, match: {url}} = ownProps
  const goToNext = () => dispatch(push(`${url}/step-${Number(step) + 1}`))
  let proceed

  if (step === '1') {
    proceed = () => dispatch(
      dcCommand(robot, {command: 'attach tip', tipLength: pipette.tipLength})
    ).then(() => dispatch(
      dcCommand(robot, {command: 'move', point: 'safeZ'})
    )).then(goToNext)
  } else if (step === '2') {
    proceed = () => dispatch(
      dcCommand(robot, {command: 'save z'})
    ).then(() => dispatch(
      dcCommand(robot, {command: 'move', point: '1'})
    )).then(goToNext)
  } else if (step === '3') {
    proceed = () => dispatch(
      dcCommand(robot, {command: 'save xy', point: '1'})
    ).then(() => dispatch(
      dcCommand(robot, {command: 'move', point: '2'})
    )).then(goToNext)
  } else if (step === '4') {
    proceed = () => dispatch(
      dcCommand(robot, {command: 'save xy', point: '2'})
    ).then(() => dispatch(
      dcCommand(robot, {command: 'move', point: '3'})
    )).then(goToNext)
  } else if (step === '5') {
    proceed = () => dispatch(
      dcCommand(robot, {command: 'save xy', point: '3'})
    ).then(() => dispatch(
      dcCommand(robot, {command: 'move', point: 'attachTip'})
    )).then(goToNext)
  } else {
    proceed = () => dispatch(
      dcCommand(robot, {command: 'save transform'})
    ).then(() => dispatch(
      restartRobotServer(robot))
    ).then(() => dispatch(push(ownProps.parentUrl)))
  }

  return {proceed}
}
