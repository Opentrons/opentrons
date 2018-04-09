// @flow
import * as React from 'react'

import type {Mount} from '../../robot'

import screwdriverSrc from './images/screwdriver.svg'
import styles from './styles.css'

// TODO(mc, 2018-04-06): flow does not like numbers as object keys
export type Channels = '1' | '8'

type Direction = 'attach' | 'detach'

type Diagram = 'screws' | 'tab'

type Props = {
  step: 'one' | 'two',
  direction: Direction,
  mount: Mount,
  channels: Channels,
  diagram: Diagram,
  children: React.Node,
}

// TODO(mc, 2018-04-06): there must be a better way...
//   this object is way nicer than a giant if/else ladder though
const DIAGRAMS: {[Direction]: {[Mount]: {[Channels]: {[Diagram]: string}}}} = {
  attach: {
    left: {
      '1': {
        screws: require('./images/attach-left-single-screws@3x.png'),
        tab: require('./images/attach-left-single-tab@3x.png')
      },
      '8': {
        screws: require('./images/attach-left-multi-screws@3x.png'),
        tab: require('./images/attach-left-multi-tab@3x.png')
      }
    },
    right: {
      '1': {
        screws: require('./images/attach-right-single-screws@3x.png'),
        tab: require('./images/attach-right-single-tab@3x.png')
      },
      '8': {
        screws: require('./images/attach-right-multi-screws@3x.png'),
        tab: require('./images/attach-right-multi-tab@3x.png')
      }
    }
  },
  detach: {
    left: {
      '1': {
        screws: require('./images/detach-left-single-screws@3x.png'),
        tab: require('./images/detach-left-single-tab@3x.png')
      },
      '8': {
        screws: require('./images/detach-left-multi-screws@3x.png'),
        tab: require('./images/detach-left-multi-tab@3x.png')
      }
    },
    right: {
      '1': {
        screws: require('./images/detach-right-single-screws@3x.png'),
        tab: require('./images/detach-right-single-tab@3x.png')
      },
      '8': {
        screws: require('./images/detach-right-multi-screws@3x.png'),
        tab: require('./images/detach-right-multi-tab@3x.png')
      }
    }
  }
}

export default function InstructionStep (props: Props) {
  const {direction, mount, channels, diagram} = props
  const diagramSrc = DIAGRAMS[direction][mount][channels][diagram]

  return (
    <fieldset className={styles.step}>
      <legend className={styles.step_legend}>
        Step {props.step}
      </legend>
      <p>
        {props.children}
      </p>
      {diagram === 'screws' && (
        <img src={screwdriverSrc} className={styles.screwdriver} />
      )}
      <img src={diagramSrc} className={styles.diagram} />
    </fieldset>
  )
}
