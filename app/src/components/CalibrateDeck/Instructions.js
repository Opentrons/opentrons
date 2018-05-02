// @flow
import * as React from 'react'
import InstructionStep from '../InstructionStep'
import {type CalibrationStep} from './types'
import styles from '../InstructionStep/styles.css'

import calibrationTipSrc from './images/initial-calib-tip.svg'

type Props = {
  calibrationStep: CalibrationStep
}
export default function Instructions (props: Props) {
  const {calibrationStep} = props
  console.log(calibrationStep)
  const diagram = getDiagramSrc(calibrationStep)
  const instructions = getInstructionsByStep(calibrationStep)
  return (
    <div className={styles.instructions}>
      <InstructionStep
        step={'one'}
        diagram={diagram}
      >
        {instructions}
      </InstructionStep>
      <InstructionStep
        step={'two'}
        diagram={calibrationTipSrc}
      >
        <p>Jog the robot until tip is <strong>just barely</strong> touching the deck.</p>
      </InstructionStep>
    </div>
  )
}

function getDiagramSrc (calibrationStep) {
  const DIAGRAMS = {
    'step-2': require('./images/initial-calib-z-5@3x.png'),
    'step-3': require('./images/initial-calib-xy-1@3x.png'),
    'step-4': require('./images/initial-calib-xy-3@3x.png'),
    'step-5': require('./images/initial-calib-xy-7@3x.png')
  }
  return DIAGRAMS[calibrationStep]
}

function getInstructionsByStep (calibrationStep) {
  const INSTRUCTIONS = {
    'step-2': 'Jog robot until tip is positioned over a flat area in slot 5 (shown in blue).',
    'step-3': (<p>Jog the robot until tip is centered above the <strong>+</strong> impression in slot 1.</p>),
    'step-4': (<p>Jog the robot until tip is centered above the <strong>+</strong> impression in slot 3.</p>),
    'step-5': (<p>Jog the robot until tip is centered above the <strong>+</strong> impression in slot 7.</p>)
  }
  return INSTRUCTIONS[calibrationStep]
}
