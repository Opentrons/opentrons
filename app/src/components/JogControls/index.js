// @flow
// jog controls component
import * as React from 'react'
import cx from 'classnames'

import type { JogAxis, JogDirection, JogStep } from '../../http-api-client'

import {
  PrimaryButton,
  RadioGroup,
  Icon,
  HandleKeypress,
  type IconName,
} from '@opentrons/components'

import styles from './styles.css'

export type Jog = (
  axis: JogAxis,
  direction: JogDirection,
  step: JogStep
) => mixed

type JogButtonProps = {|
  name: string,
  icon: IconName,
  onClick: () => mixed,
|}

export type JogControlsProps = {| jog: Jog |}

type JogControlsState = {| step: JogStep |}

const JOG_BUTTON_NAMES = ['left', 'right', 'back', 'forward', 'up', 'down']

const JOG_ICONS_BY_NAME = {
  left: 'ot-arrow-left',
  right: 'ot-arrow-right',
  back: 'ot-arrow-up',
  forward: 'ot-arrow-down',
  up: 'ot-arrow-up',
  down: 'ot-arrow-down',
}

const JOG_PARAMS_BY_NAME = {
  left: ['x', -1],
  right: ['x', 1],
  back: ['y', 1],
  forward: ['y', -1],
  up: ['z', 1],
  down: ['z', -1],
}

const STEPS: Array<JogStep> = [0.1, 1, 10]
const STEP_OPTIONS = STEPS.map(s => ({ name: `${s} mm`, value: `${s}` }))

export class JogControls extends React.Component<
  JogControlsProps,
  JogControlsState
> {
  constructor(props: JogControlsProps) {
    super(props)
    this.state = { step: STEPS[0] }
  }

  increaseStepSize = () => {
    const i = STEPS.indexOf(this.state.step)
    if (i < STEPS.length - 1) this.setState({ step: STEPS[i + 1] })
  }

  decreaseStepSize = () => {
    const i = STEPS.indexOf(this.state.step)
    if (i > 0) this.setState({ step: STEPS[i - 1] })
  }

  handleStepSelect = (event: SyntheticInputEvent<*>) => {
    this.setState({ step: Number(event.target.value) })
    event.target.blur()
  }

  getJogHandlers() {
    const { jog } = this.props
    const { step } = this.state

    return JOG_BUTTON_NAMES.reduce(
      (result, name) => ({
        ...result,
        [name]: jog.bind(null, ...JOG_PARAMS_BY_NAME[name], step),
      }),
      {}
    )
  }

  renderJogControls() {
    const { step } = this.state
    const jogHandlers = this.getJogHandlers()

    return (
      <HandleKeypress
        preventDefault
        handlers={[
          { key: 'ArrowLeft', shiftKey: false, onPress: jogHandlers.left },
          { key: 'ArrowRight', shiftKey: false, onPress: jogHandlers.right },
          { key: 'ArrowUp', shiftKey: false, onPress: jogHandlers.back },
          { key: 'ArrowDown', shiftKey: false, onPress: jogHandlers.forward },
          { key: 'ArrowUp', shiftKey: true, onPress: jogHandlers.up },
          { key: 'ArrowDown', shiftKey: true, onPress: jogHandlers.down },
          { key: '-', onPress: this.decreaseStepSize },
          { key: '_', onPress: this.decreaseStepSize },
          { key: '=', onPress: this.increaseStepSize },
          { key: '+', onPress: this.increaseStepSize },
        ]}
      >
        {JOG_BUTTON_NAMES.map(name => (
          <JogButton
            key={name}
            name={name}
            icon={JOG_ICONS_BY_NAME[name]}
            onClick={jogHandlers[name]}
          />
        ))}
        <span className={styles.increment_group}>
          <RadioGroup
            className={styles.increment_item}
            value={`${step}`}
            options={STEP_OPTIONS}
            onChange={this.handleStepSelect}
          />
        </span>
      </HandleKeypress>
    )
  }

  render() {
    return (
      <div className={styles.jog_container}>
        <div className={styles.jog_controls}>
          <span className={styles.jog_increment}>
            Jump Size
            <span className={styles.jog_label_keys}>Change with + and -</span>
          </span>
          <span className={styles.jog_label_xy}>
            Across Deck
            <span className={styles.jog_label_keys}>Arrow keys</span>
          </span>
          <span className={styles.jog_label_z}>
            Up & Down
            <span className={styles.jog_label_keys}>Arrow keys + SHIFT</span>
          </span>
          {this.renderJogControls()}
        </div>
      </div>
    )
  }
}

function JogButton(props: JogButtonProps) {
  const { name, icon, onClick } = props
  const className = cx(styles.jog_button, styles[name])

  return (
    <PrimaryButton className={className} title={name} onClick={onClick}>
      <Icon name={icon} />
    </PrimaryButton>
  )
}
