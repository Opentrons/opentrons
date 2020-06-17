// @flow

import * as React from 'react'

import cx from 'classnames'

import { type RobotCalibrationCheckComparison } from '../../calibration'
import { ThresholdValue } from './ThresholdValue'
import { IndividualAxisDifferenceValue } from './DifferenceValue'
import { type Axis } from '../../robot'

import styles from './styles.css'

type EndOfStepComparisonsProps = {|
  comparison: RobotCalibrationCheckComparison,
  forAxes: Array<Axis>,
|}

const TOLERANCE_RANGE = 'tolerance range'
const DIFFERENCE = 'difference'

const axisToIndex: { [Axis]: number } = {
  x: 0,
  y: 1,
  z: 2,
}

const AXIS_NAMES = ['X-Axis', 'Y-Axis', 'Z-Axis']

export function EndOfStepComparison(
  props: EndOfStepComparisonsProps
): React.Node {
  const { thresholdVector, differenceVector } = props.comparison
  return (
    <div className={styles.individual_step_comparison_wrapper}>
      <table className={cx(styles.pipette_data_table, styles.individual_data)}>
        <thead>
          <tr>
            <th>{TOLERANCE_RANGE}</th>
            <th>{DIFFERENCE}</th>
          </tr>
        </thead>
        <tbody>
          {props.forAxes.map(axis => {
            const index = axisToIndex[axis]
            const zeroedThreshold = [0, 0, 0]
            zeroedThreshold[index] = thresholdVector[index]
            return (
              <tr key={axis}>
                <td key={axis + '-threshold'}>
                  <div>
                    <span className={styles.compare_axis_label}>
                      {AXIS_NAMES[index]}:
                    </span>
                    <ThresholdValue thresholdVector={zeroedThreshold} />
                  </div>
                </td>
                <td key={axis + '-difference'}>
                  <IndividualAxisDifferenceValue
                    difference={{ value: differenceVector[index] }}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
