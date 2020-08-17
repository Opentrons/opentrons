// @flow
import * as React from 'react'

import { InstructionStep } from '../InstructionStep'
import styles from '../InstructionStep/styles.css'
import calibrationTipSrc from './images/initial-calib-tip.svg'

import type { CalibrationStep } from './types'

export type InstructionsProps = {|
  calibrationStep: CalibrationStep,
|}

const DIAGRAMS: { [step: CalibrationStep]: ?string } = {
  '2': require('./images/initial-calib-z-5@3x.png'),
  '3': require('./images/initial-calib-xy-1@3x.png'),
  '4': require('./images/initial-calib-xy-3@3x.png'),
  '5': require('./images/initial-calib-xy-7@3x.png'),
}

const INSTRUCTIONS: { [step: CalibrationStep]: ?React.Node } = {
  '2':
    'Jog robot until tip is positioned over a flat area in slot 5 (shown in blue).',
  '3': (
    <p>
      Jog the robot until tip is centered above the <strong>+</strong>{' '}
      impression in slot 1.
    </p>
  ),
  '4': (
    <p>
      Jog the robot until tip is centered above the <strong>+</strong>{' '}
      impression in slot 3.
    </p>
  ),
  '5': (
    <p>
      Jog the robot until tip is centered above the <strong>+</strong>{' '}
      impression in slot 7.
    </p>
  ),
}

export function Instructions(props: InstructionsProps): React.Node {
  const { calibrationStep } = props
  const diagram = getDiagramSrc(calibrationStep)
  const instructions = getInstructionsByStep(calibrationStep)

  if (!diagram || !instructions) return null

  return (
    <div className={styles.instructions}>
      <InstructionStep step={'one'} diagram={diagram}>
        {instructions}
      </InstructionStep>
      <InstructionStep step={'two'} diagram={calibrationTipSrc}>
        <p>
          Jog the robot until tip is <strong>just barely</strong> touching the
          deck.
        </p>
      </InstructionStep>
    </div>
  )
}

function getDiagramSrc(calibrationStep) {
  return DIAGRAMS[calibrationStep]
}

function getInstructionsByStep(calibrationStep) {
  return INSTRUCTIONS[calibrationStep]
}
