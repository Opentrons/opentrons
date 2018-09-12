// @flow
import * as React from 'react'

import type {PipetteChannels} from '@opentrons/shared-data'
import type {Mount} from '../../robot'
import type {Direction} from './types'

import screwdriverSrc from './images/screwdriver.svg'
import styles from './styles.css'

type Diagram = 'screws' | 'tab'

type DiagramProps = {
  direction: Direction,
  mount: Mount,
  channels: PipetteChannels,
  diagram: Diagram,
}

type Props = DiagramProps & {
  step: 'one' | 'two',
  children: React.Node,
}

type Channels = 'single' | 'multi'

// TODO(mc, 2018-04-06): there must be a better way...
//   this object is way nicer than a giant if/else ladder though
const DIAGRAMS: {[Direction]: {[Mount]: {[Channels]: {[Diagram]: string}}}} = {
  attach: {
    left: {
      'single': {
        screws: require('./images/attach-left-single-screws@3x.png'),
        tab: require('./images/attach-left-single-tab@3x.png'),
      },
      'multi': {
        screws: require('./images/attach-left-multi-screws@3x.png'),
        tab: require('./images/attach-left-multi-tab@3x.png'),
      },
    },
    right: {
      'single': {
        screws: require('./images/attach-right-single-screws@3x.png'),
        tab: require('./images/attach-right-single-tab@3x.png'),
      },
      'multi': {
        screws: require('./images/attach-right-multi-screws@3x.png'),
        tab: require('./images/attach-right-multi-tab@3x.png'),
      },
    },
  },
  detach: {
    left: {
      'single': {
        screws: require('./images/detach-left-single-screws@3x.png'),
        tab: require('./images/detach-left-single-tab@3x.png'),
      },
      'multi': {
        screws: require('./images/detach-left-multi-screws@3x.png'),
        tab: require('./images/detach-left-multi-tab@3x.png'),
      },
    },
    right: {
      'single': {
        screws: require('./images/detach-right-single-screws@3x.png'),
        tab: require('./images/detach-right-single-tab@3x.png'),
      },
      'multi': {
        screws: require('./images/detach-right-multi-screws@3x.png'),
        tab: require('./images/detach-right-multi-tab@3x.png'),
      },
    },
  },
}

export default function InstructionStep (props: Props) {
  const {diagram} = props
  const diagramSrc = getDiagramSrc(props)

  return (
    <fieldset className={styles.step}>
      <legend className={styles.step_legend}>
        Step {props.step}
      </legend>
      <div>
        {props.children}
      </div>
      {diagram === 'screws' && (
        <img src={screwdriverSrc} className={styles.screwdriver} />
      )}
      <img src={diagramSrc} className={styles.diagram} />
    </fieldset>
  )
}

export function getDiagramSrc (props: DiagramProps): string {
  const {direction, mount, channels, diagram} = props
  const channelsKey = channels === 8
    ? 'multi'
    : 'single'

  return DIAGRAMS[direction][mount][channelsKey][diagram]
}
