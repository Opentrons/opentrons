// @flow
import type {
  PipetteChannels,
  PipetteDisplayCategory,
} from '@opentrons/shared-data'
import * as React from 'react'

import type { Mount } from '../../robot'
import screwdriverSrc from './images/screwdriver.svg'
import styles from './styles.css'
import type { Direction } from './types'

type Diagram = 'screws' | 'tab'

type DiagramProps = {|
  direction: Direction,
  mount: Mount,
  channels: PipetteChannels,
  diagram: Diagram,
  displayCategory: PipetteDisplayCategory | null,
|}

type Props = {|
  ...DiagramProps,
  step: 'one' | 'two',
  children: React.Node,
|}

export function getDiagramsSrc(props: DiagramProps): string {
  const { channels, displayCategory, direction, mount, diagram } = props
  const channelsKey = channels === 8 ? 'multi' : 'single'

  return displayCategory === 'GEN2'
    ? require(`./images/${direction}-${mount}-${channelsKey}-GEN2-${diagram}@3x.png`)
    : require(`./images/${direction}-${mount}-${channelsKey}-${diagram}@3x.png`)
}

export function InstructionStep(props: Props): React.Node {
  const { step, children, ...diagramProps } = props

  return (
    <fieldset className={styles.step}>
      <legend className={styles.step_legend}>Step {step}</legend>
      <div>{children}</div>
      {props.diagram === 'screws' && (
        <img src={screwdriverSrc} className={styles.screwdriver} />
      )}
      <img src={getDiagramsSrc(diagramProps)} className={styles.diagram} />
    </fieldset>
  )
}
