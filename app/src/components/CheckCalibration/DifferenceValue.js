// @flow
import * as React from 'react'
import type { RobotCalibrationCheckStep } from '../../calibration'
import * as Calibration from '../../calibration'
import styles from './styles.css'

const axisIndicesByStep: { [RobotCalibrationCheckStep]: Array<number>, ... } = {
  [Calibration.CHECK_STEP_COMPARING_FIRST_PIPETTE_HEIGHT]: [2],
  [Calibration.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_ONE]: [0, 1],
  [Calibration.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_TWO]: [0, 1],
  [Calibration.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_THREE]: [0, 1],
  [Calibration.CHECK_STEP_COMPARING_SECOND_PIPETTE_HEIGHT]: [2],
  [Calibration.CHECK_STEP_COMPARING_SECOND_PIPETTE_POINT_ONE]: [0, 1],
}
const AXIS_NAMES = ['X', 'Y', 'Z']

type Props = {|
  stepName: RobotCalibrationCheckStep,
  differenceVector: [number, number, number],
|}

export function DifferenceValue(props: Props): React.Node {
  const { stepName, differenceVector } = props
  return (
    <div className={styles.difference_value_data_cell}>
      {axisIndicesByStep[stepName].map(axisIndex => {
        const rawValue = differenceVector[axisIndex]
        const formattedValue = parseFloat(rawValue).toFixed(1)
        return (
          <div className={styles.data_axis_label}>
            <p>{AXIS_NAMES[axisIndex]}</p>
            <p>{`${rawValue > 0 ? '+' : ''}${formattedValue} mm`}</p>
          </div>
        )
      })}
    </div>
  )
}
