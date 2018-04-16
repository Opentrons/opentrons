// @flow
import * as React from 'react'
import cx from 'classnames'
import {Redirect} from 'react-router'
import {Link} from 'react-router-dom'

import {Icon, PrimaryButton} from '@opentrons/components'

import type {ChangePipetteProps} from './types'
import {getDiagramSrc} from './InstructionStep'
import TitledModal from './TitledModal'
import styles from './styles.css'

const EXIT_BUTTON_MESSAGE = 'exit pipette setup'

export default function ConfirmPipette (props: ChangePipetteProps) {
  const {pipette, pipettes: attachedPipettes, mount} = props

  if (!pipette) return (<Redirect to={props.baseUrl} />)

  const success = (
    attachedPipettes &&
    attachedPipettes[mount].model === pipette.model
  )

  let exitButtonProps = {className: styles.confirm_button}

  exitButtonProps = success
    ? {...exitButtonProps, onClick: props.exit}
    : {...exitButtonProps, Component: Link, to: props.exitUrl}

  return (
    <TitledModal
      titleBar={{
        title: props.title,
        subtitle: props.subtitle,
        back: {onClick: props.back, disabled: !!success}
      }}
      contentsClassName={styles.confirm_pipette_contents}
    >
      <Status name={pipette.name} success={success} />
      {!success && (
        <FailureToDetect {...props} />
      )}
      <PrimaryButton {...exitButtonProps}>
        {EXIT_BUTTON_MESSAGE}
      </PrimaryButton>
    </TitledModal>
  )
}

function Status (props: {name: string, success: ?boolean}) {
  const {name, success} = props
  const iconName = success ? 'check-circle' : 'close-circle'
  const iconClass = cx(styles.confirm_icon, {
    [styles.success]: success,
    [styles.failure]: !success
  })

  const message = success
    ? `${name} succesfully attached.`
    : `Unable to detect ${name}.`

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
        src={getDiagramSrc({...props, ...props.pipette, diagram: 'tab'})}
      />
      <p className={styles.confirm_failure_instructions}>
        Check again to ensure that white connector tab is plugged into pipette.
      </p>
      <PrimaryButton
        className={styles.confirm_button}
        onClick={props.checkPipette}
      >
        have robot check connection again
      </PrimaryButton>
    </div>
  )
}
