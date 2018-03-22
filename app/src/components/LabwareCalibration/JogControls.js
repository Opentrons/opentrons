// @flow
// jog controls component for ConfirmPositionContents
import * as React from 'react'
import cx from 'classnames'

import type {Labware, JogButtonName} from '../../robot'

import {
  PrimaryButton,
  Icon,
  type IconName
} from '@opentrons/components'

import styles from './styles.css'

type JogButtonProps = {
  name: JogButtonName,
  onClick: () => void
}

export type JogControlsProps = Labware & {
  jogButtons: Array<JogButtonProps>
}

const ARROW_ICONS_BY_NAME: {[JogButtonName]: IconName} = {
  left: 'chevron-left',
  right: 'chevron-right',
  back: 'chevron-up',
  forward: 'chevron-down',
  up: 'chevron-up',
  down: 'chevron-down'
}

export default function JogControls (props: JogControlsProps) {
  return (
    <div className={styles.jog_container}>
      <div className={styles.jog_controls}>
        {props.jogButtons.map((button) => (
          <JogButton key={button.name} {...button} />
        ))}
        <span className={styles.jog_label_xy}>
          X-Y axis
        </span>
        <span className={styles.jog_label_z}>
          Z axis
        </span>
      </div>
    </div>
  )
}

function JogButton (props: JogButtonProps) {
  const {name, onClick} = props
  const className = cx(styles.jog_button, styles[name])

  return (
    <PrimaryButton
      className={className}
      title={name}
      onClick={onClick}
    >
      <Icon name={ARROW_ICONS_BY_NAME[name]} />
    </PrimaryButton>
  )
}
