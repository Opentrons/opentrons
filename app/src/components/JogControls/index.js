// @flow
// jog controls component
import * as React from 'react'
import cx from 'classnames'

import type {JogAxis, JogDirection, JogStep} from '../../http-api-client'

import {
  PrimaryButton,
  RadioGroup,
  Icon,
  type IconName
} from '@opentrons/components'

import styles from './styles.css'

type Jog = (axis: JogAxis, direction: JogDirection, step: JogStep) => mixed

type JogButtonProps = {
  name: string,
  icon: IconName,
  jog: Jog,
  axis: JogAxis,
  direction: JogDirection,
  step: JogStep,
}

export type JogControlsProps = {
  jog: Jog,
  step: JogStep,
  onStepSelect: (event: SyntheticInputEvent<*>) => mixed,
}

const JOG_BUTTONS: Array<{
  name: string,
  axis: JogAxis,
  direction: JogDirection,
  icon: IconName
}> = [
  {name: 'left', axis: 'x', direction: -1, icon: 'ot-arrow-left'},
  {name: 'right', axis: 'x', direction: 1, icon: 'ot-arrow-right'},
  {name: 'back', axis: 'y', direction: 1, icon: 'ot-arrow-up'},
  {name: 'forward', axis: 'y', direction: -1, icon: 'ot-arrow-down'},
  {name: 'up', axis: 'z', direction: 1, icon: 'ot-arrow-up'},
  {name: 'down', axis: 'z', direction: -1, icon: 'ot-arrow-down'}
]

export default function JogControls (props: JogControlsProps) {
  const {jog, step, onStepSelect} = props

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
          <JogButton key={button.name} {...button} jog={jog} step={step} />
        ))}
        <span className={styles.jog_increment}>
          Jump Size
        </span>
        <span className={styles.increment_group}>
        <RadioGroup
          className={styles.increment_item}
          value={`${step}`}
          options={[
            {name: '0.1 mm', value: '0.1'},
            {name: '1 mm', value: '1'},
            {name: '10 mm', value: '10'}
          ]}
          onChange={onStepSelect}
        />
      </span>
      </div>
    </div>
  )
}

function JogButton (props: JogButtonProps) {
  const {name, icon, jog, axis, direction, step} = props
  const className = cx(styles.jog_button, styles[name])

  // TODO(mc, 2018-05-07): I tried to make this a class based component to
  //  have handleClick be a class method, but props ended up out-of-date in the
  //  handler but not in render. No idea why this was happening but figure it
  //  out because it's concerning
  const handleClick = () => jog(axis, direction, step)

  return (
    <PrimaryButton
      className={className}
      title={name}
      onClick={handleClick}
    >
      <Icon name={icon} />
    </PrimaryButton>
  )
}
