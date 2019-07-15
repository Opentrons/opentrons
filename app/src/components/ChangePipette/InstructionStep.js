// @flow
import * as React from 'react'

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

function getDiagramsSrc(props: Props) {
  const { channels, generation, direction, mount, diagram } = props
  const channelsKey = channels === 8 ? 'multi' : 'single'

  console.log(
    `./images/${direction}-${mount}-${channelsKey}-GEN2-${diagram}@3x.png`
  )

  switch (generation) {
    case 2:
      return require(`./images/${direction}-${mount}-${channelsKey}-GEN2-${diagram}@3x.png`)
    case 1:
    default:
      return require(`./images/${direction}-${mount}-${channelsKey}-${diagram}@3x.png`)
  }
}

export default function InstructionStep(props: Props) {
  return (
    <fieldset className={styles.step}>
      <legend className={styles.step_legend}>Step {props.step}</legend>
      <div>{props.children}</div>
      {props.diagram === 'screws' && (
        <img src={screwdriverSrc} className={styles.screwdriver} />
      )}
      <img src={getDiagramsSrc(props)} className={styles.diagram} />
    </fieldset>
  )
}
