// @flow
import * as React from 'react'

import type {
  PipetteChannels,
  PipetteDisplayCategory,
} from '@opentrons/shared-data'
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
  displayCategory: PipetteDisplayCategory,
}

type Props = DiagramProps & {
  step: 'one' | 'two',
  children: React.Node,
}

export function getDiagramsSrc(props: DiagramProps) {
  const { channels, displayCategory, direction, mount, diagram } = props
  const channelsKey = channels === 8 ? 'multi' : 'single'

  switch (displayCategory) {
    case 'GEN2':
      return require(`./images/${direction}-${mount}-${channelsKey}-GEN2-${diagram}@3x.png`)
    case 'OG':
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
