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
  type KeypressHandler,
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

export type JogControlsProps = {|
  jog: Jog,
  stepSizes: Array<JogStep>,
  axes: Array<JogAxis>,
|}

type JogControlsState = {| step: JogStep |}

const JOG_BUTTON_NAMES_BY_AXIS: { [JogAxis]: Array<string> } = {
  x: ['left', 'right'],
  y: ['back', 'forward'],
  z: ['up', 'down'],
}

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

const DEFAULT_STEPS: Array<JogStep> = [0.1, 1, 10]
const stepToOption = (step: JogStep) => ({
  name: `${step} mm`,
  value: `${step}`,
})

export class JogControls extends React.Component<
  JogControlsProps,
  JogControlsState
> {
  static defaultProps = {
    stepSizes: DEFAULT_STEPS,
    axes: ['x', 'y', 'z'],
  }

  constructor(props: JogControlsProps) {
    super(props)
    this.state = { step: props.stepSizes[0] }
  }

  increaseStepSize = () => {
    const i = this.props.stepSizes.indexOf(this.state.step)
    if (i < this.props.stepSizes.length - 1)
      this.setState({ step: this.props.stepSizes[i + 1] })
  }

  decreaseStepSize = () => {
    const i = this.props.stepSizes.indexOf(this.state.step)
    if (i > 0) this.setState({ step: this.props.stepSizes[i - 1] })
  }

  handleStepSelect = (event: SyntheticInputEvent<*>) => {
    this.setState({ step: Number(event.target.value) })
    event.target.blur()
  }

  getJogHandlers() {
    const { jog } = this.props
    const { step } = this.state

    return {
      left: jog.bind(null, ...JOG_PARAMS_BY_NAME.left, step),
      right: jog.bind(null, ...JOG_PARAMS_BY_NAME.right, step),
      back: jog.bind(null, ...JOG_PARAMS_BY_NAME.back, step),
      forward: jog.bind(null, ...JOG_PARAMS_BY_NAME.forward, step),
      up: jog.bind(null, ...JOG_PARAMS_BY_NAME.up, step),
      down: jog.bind(null, ...JOG_PARAMS_BY_NAME.down, step),
    }
  }

  renderJogControls() {
    const { step } = this.state
    const { axes } = this.props
    const jogHandlers = this.getJogHandlers()

    const handlersByAxis: { [JogAxis]: Array<KeypressHandler> } = {
      x: [
        { key: 'ArrowLeft', shiftKey: false, onPress: jogHandlers.left },
        { key: 'ArrowRight', shiftKey: false, onPress: jogHandlers.right },
      ],
      y: [
        { key: 'ArrowUp', shiftKey: false, onPress: jogHandlers.back },
        { key: 'ArrowDown', shiftKey: false, onPress: jogHandlers.forward },
      ],
      z: [
        { key: 'ArrowUp', shiftKey: true, onPress: jogHandlers.up },
        { key: 'ArrowDown', shiftKey: true, onPress: jogHandlers.down },
      ],
    }

    // NOTE: must use flatMap identity instead of native .flat()
    // because flow will bail out type to mixed with the latter
    const handlersForAxes: Array<KeypressHandler> = axes
      .map(a => handlersByAxis[a])
      .flatMap(handler => handler)

    return (
      <HandleKeypress
        preventDefault
        handlers={[
          ...handlersForAxes,
          { key: '-', onPress: this.decreaseStepSize },
          { key: '_', onPress: this.decreaseStepSize },
          { key: '=', onPress: this.increaseStepSize },
          { key: '+', onPress: this.increaseStepSize },
        ]}
      >
        {axes
          .map(a => JOG_BUTTON_NAMES_BY_AXIS[a])
          .flatMap(name => name)
          .map(name => (
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
            options={this.props.stepSizes.map(s => stepToOption(s))}
            onChange={this.handleStepSelect}
          />
        </span>
      </HandleKeypress>
    )
  }

  render() {
    const hasAcrossControls =
      this.props.axes.includes('x') || this.props.axes.includes('y')
    return (
      <div className={styles.jog_container}>
        <div className={styles.jog_controls}>
          <span className={styles.jog_increment}>
            Jump Size
            <span className={styles.jog_label_keys}>Change with + and -</span>
          </span>
          {hasAcrossControls ? (
            <span className={styles.jog_label_xy}>
              Across Deck
              <span className={styles.jog_label_keys}>Arrow keys</span>
            </span>
          ) : null}
          {this.props.axes.includes('z') ? (
            <span className={styles.jog_label_z}>
              Up & Down
              <span className={styles.jog_label_keys}>Arrow keys + SHIFT</span>
            </span>
          ) : null}
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
