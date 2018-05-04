// @flow
// jog controls component for ConfirmPositionContents
import * as React from 'react'
import cx from 'classnames'

import type {JogButtonName, Axis, Direction} from '../../robot'

import {
  PrimaryButton,
  RadioGroup,
  Icon,
  type IconName
} from '@opentrons/components'

import styles from './styles.css'

type JogButtonProps = {
  name: JogButtonName,
  onClick: () => mixed,
  icon: IconName,
}

const JOG_BUTTONS: Array<{
  name: JogButtonName,
  axis: Axis,
  direction: Direction,
  icon: IconName
}> = [
  {name: 'left', axis: 'x', direction: -1, icon: 'ot-arrow-left'},
  {name: 'right', axis: 'x', direction: 1, icon: 'ot-arrow-right'},
  {name: 'back', axis: 'y', direction: 1, icon: 'ot-arrow-up'},
  {name: 'forward', axis: 'y', direction: -1, icon: 'ot-arrow-down'},
  {name: 'up', axis: 'z', direction: 1, icon: 'ot-arrow-up'},
  {name: 'down', axis: 'z', direction: -1, icon: 'ot-arrow-down'}
]

export type JogControlsProps = {
  makeJog: (axis: Axis, direction: Direction) => () => mixed,
  currentJogDistance: number,
  onIncrementSelect: (event: SyntheticInputEvent<*>) => mixed,
}

export default function JogControls (props: JogControlsProps) {
  const {makeJog} = props
  return (
    <div className={styles.jog_container}>
      <div className={styles.jog_controls}>
        <span className={styles.jog_label_xy}>
          Across Deck
        </span>
        <span className={styles.jog_label_z}>
          Up & Down
        </span>
        {JOG_BUTTONS.map((button) => (
          <JogButton key={button.name} {...button} onClick={makeJog(button.axis, button.direction)} />
        ))}
        <span className={styles.jog_increment}>
          Jump Size
        </span>
        <span className={styles.increment_group}>
        <RadioGroup
          className={styles.increment_item}
          value={`${props.currentJogDistance}`}
          options={[
            {name: '0.1 mm', value: '0.1'},
            {name: '1 mm', value: '1'},
            {name: '10 mm', value: '10'}
          ]}
          onChange={props.onIncrementSelect}
        />
      </span>
      </div>
    </div>
  )
}

function JogButton (props: JogButtonProps) {
  const {name, onClick, icon} = props
  const className = cx(styles.jog_button, styles[name])

  return (
    <PrimaryButton
      className={className}
      title={name}
      onClick={onClick}
    >
      <Icon name={icon} />
    </PrimaryButton>
  )
}
