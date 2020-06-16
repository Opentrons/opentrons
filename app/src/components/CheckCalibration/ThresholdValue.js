// @flow
import * as React from 'react'
import type { RobotCalibrationCheckStep } from '../../calibration'
import * as Calibration from '../../calibration'
import styles from './styles.css'

type Props = {|
  thresholdVector: [number, number, number],
|}

export function ThresholdValue(props: Props): React.Node {
  const value = props.thresholdVector.find(axis => axis > 0)
  const formattedValue = parseFloat(value).toFixed(1)
  return <span>{`±${formattedValue} mm`}</span>
}
