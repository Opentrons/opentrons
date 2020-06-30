// @flow
// diagram and instructions for ConfirmPositionContents
import * as React from 'react'

import type { Labware, Pipette } from '../../robot'

import { InstructionStep } from '../InstructionStep'
import styles from '../InstructionStep/styles.css'
import { getInstructionsByType, getDiagramSrc } from './instructions-data'

export type LabwareCalibrationProps = {|
  labware: Labware,
  calibrator: Pipette,
  calibrateToBottom: boolean,
  buttonText: string,
  useCenteredTroughs: boolean,
|}

export function ConfirmPositionDiagram(
  props: LabwareCalibrationProps
): React.Node {
  const instructions = getInstructionsByType(props)
  const diagrams = getDiagramSrc(props)

  return (
    diagrams && (
      <div className={styles.instructions}>
        <InstructionStep step={'one'} diagram={diagrams.one}>
          {instructions.one}
        </InstructionStep>
        <InstructionStep step={'two'} diagram={diagrams.two}>
          {instructions.two}
        </InstructionStep>
      </div>
    )
  )
}
