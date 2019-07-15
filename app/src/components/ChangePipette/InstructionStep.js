// @flow
import * as React from 'react'
import cx from 'classnames'

import type { PipetteChannels } from '@opentrons/shared-data'
import type { Mount } from '../../robot'
import type { Direction } from './types'

import screwdriverSrc from './images/screwdriver.svg'
import styles from './styles.css'

type Diagram = 'screws' | 'tab'

type DiagramProps = {
  direction: Direction,
  mount: Mount,
  channels: PipetteChannels,
  diagram: Diagram,
  generation: number,
}

type Props = DiagramProps & {
  step: 'one' | 'two',
  children: React.Node,
}

type Channels = 'single' | 'multi'

function getDiagramsSrc(
  channels: Channels,
  generation: number,
  direction: Direction
) {
  switch (generation) {
    case 2:
      return {
        screws: require(`./images/${direction}-left-${channels}-GEN2-screws@3x.png`),
        tab: require(`./images/${direction}-left-${channels}-GEN2-tab@3x.png`),
      }
    case 1:
    default:
      return {
        screws: require(`./images/${direction}-left-${channels}-screws@3x.png`),
        tab: require(`./images/${direction}-left-${channels}-tab@3x.png`),
      }
  }
}

export default function InstructionStep(props: Props) {
  const { diagram, channels, generation, direction, mount } = props
  const diagramsSrcByName = getDiagramsSrc(channels, generation, direction)

  return (
    <fieldset className={styles.step}>
      <legend className={styles.step_legend}>Step {props.step}</legend>
      <div>{props.children}</div>
      {diagram === 'screws' && (
        <img src={screwdriverSrc} className={styles.screwdriver} />
      )}
      <img
        src={diagramsSrcByName[diagram]}
        className={cx(styles.diagram, {
          [styles.flipped_image]: mount === 'right',
        })}
      />
    </fieldset>
  )
}
