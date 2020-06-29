// @flow

import { Tooltip, TOOLTIP_TOP, useHoverTooltip } from '@opentrons/components'
import cx from 'classnames'
import * as React from 'react'

import type { Axis } from '../../robot/types'
import type { RobotCalibrationCheckComparison } from '../../sessions/types'
import { IndividualAxisDifferenceValue } from './DifferenceValue'
import styles from './styles.css'
import { ThresholdValue } from './ThresholdValue'

type EndOfStepComparisonsProps = {|
  comparison: RobotCalibrationCheckComparison,
  forAxes: Array<Axis>,
|}

const TOLERANCE_RANGE = 'tolerance range'
const DIFFERENCE = 'difference'
const DIFFERENCE_TOOLTIP =
  'The difference between jogged tip position and saved calibration coordinate.'

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
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_TOP,
  })
  return (
    <div className={styles.individual_step_comparison_wrapper}>
      <table className={cx(styles.pipette_data_table, styles.individual_data)}>
        <thead>
          <tr>
            <th>{TOLERANCE_RANGE}</th>
            <th>
              <span {...targetProps}>{DIFFERENCE}</span>
            </th>
            <Tooltip {...tooltipProps}>{DIFFERENCE_TOOLTIP}</Tooltip>
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
