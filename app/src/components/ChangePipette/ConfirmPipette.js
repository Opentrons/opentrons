// @flow
import * as React from 'react'
import cx from 'classnames'
import {Link} from 'react-router-dom'

import {Icon, PrimaryButton} from '@opentrons/components'

import type {Mount} from '../../robot'
import type {Direction, Channels} from './InstructionStep'
import {getDiagramSrc} from './InstructionStep'
import TitledModal from './TitledModal'
import styles from './styles.css'

type Props = {
  title: string,
  subtitle: string,
  name: string,
  channels: Channels,
  direction: Direction,
  mount: Mount,
  error?: ?{message: ?string},
  exitUrl: string,
  exit: () => mixed,
  // confirm: () => mixed,
  onBackClick: () => mixed,
}

const EXIT_BUTTON_MESSAGE = 'exit pipette setup'

export default function ConfirmPipette (props: Props) {
  let exitButtonProps = {className: styles.confirm_button}

  exitButtonProps = props.error
    ? {...exitButtonProps, Component: Link, to: props.exitUrl}
    : {...exitButtonProps, onClick: props.exit}

  return (
    <TitledModal
      contentsClassName={styles.confirm_pipette_contents}
      title={props.title}
      subtitle={props.subtitle}
      onBackClick={props.onBackClick}
      backClickDisabled
    >
      <Status {...props} />
      <FailureToDetect {...props} />
      <PrimaryButton {...exitButtonProps}>
        {EXIT_BUTTON_MESSAGE}
      </PrimaryButton>
    </TitledModal>
  )
}

function Status (props: Props) {
  const {name, error} = props
  const iconName = error ? 'close-circle' : 'check-circle'
  const iconClass = cx(styles.confirm_icon, {
    [styles.success]: !error,
    [styles.failure]: error
  })

  const message = error
    ? `Unable to detect ${name}.`
    : `${name} succesfully attached.`

  return (
    <div className={styles.confirm_status}>
      <Icon name={iconName} className={iconClass} />
      {message}
    </div>
  )
}

function FailureToDetect (props: Props) {
  if (!props.error) return null

  return (
    <div>
      <img
        className={styles.confirm_diagram}
        src={getDiagramSrc({...props, diagram: 'tab'})}
      />
      <p className={styles.confirm_failure_instructions}>
        Check again to ensure that white connector tab is plugged into pipette.
      </p>
      <PrimaryButton className={styles.confirm_button}>
        have robot check connection again
      </PrimaryButton>
    </div>
  )
}
