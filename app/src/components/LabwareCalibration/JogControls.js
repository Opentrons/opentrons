// @flow
// jog controls component for ConfirmPositionContents
import * as React from 'react'
import cx from 'classnames'

import type {Labware, JogButtonName} from '../../robot'

import {
  PrimaryButton,
  RadioGroup,
  Icon,
  type IconName
} from '@opentrons/components'

import styles from './styles.css'

type JogButtonProps = {
  name: JogButtonName,
  onClick: () => void,
}

export type JogControlsProps = Labware & {
  jogButtons: Array<JogButtonProps>,
  currentJogDistance: number,
  onIncrementSelect: (event: SyntheticInputEvent<*>) => mixed,
}

const ARROW_ICONS_BY_NAME: {[JogButtonName]: IconName} = {
  left: 'ot-arrow-left',
  right: 'ot-arrow-right',
  back: 'ot-arrow-up',
  forward: 'ot-arrow-down',
  up: 'ot-arrow-up',
  down: 'ot-arrow-down'
}

export default function JogControls (props: JogControlsProps) {
  console.log(props.currentJogDistance)
  return (
    <div className={styles.jog_container}>
      <div className={styles.jog_controls}>
        <span className={styles.jog_label_xy}>
          Across Deck
        </span>
        <span className={styles.jog_label_z}>
          Up & Down
        </span>
        {props.jogButtons.map((button) => (
          <JogButton key={button.name} {...button} />
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
