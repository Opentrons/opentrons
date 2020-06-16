// @flow
import * as React from 'react'
import cx from 'classnames'
import { Icon } from '@opentrons/components'
import { getPipetteModelSpecs } from '@opentrons/shared-data'
import map from 'lodash/map'
import type {
  RobotCalibrationCheckComparison,
  RobotCalibrationCheckInstrument,
  RobotCalibrationCheckStep,
  RobotCalibrationCheckComparisonsByStep,
} from '../../calibration'
import * as Calibration from '../../calibration'
import { DifferenceValue } from './DifferenceValue'
import { ThresholdValue } from './ThresholdValue'
import styles from './styles.css'

const PASS = 'pass'
const FAIL = 'fail'

const PIPETTE = 'pipette'
const POSITION = 'position'
const STATUS = 'status'
const TOLERANCE_RANGE = 'tolerance range'
const DIFFERENCE = 'difference'

const HEIGHT_CHECK_DISPLAY_NAME = 'Slot 5 Z-axis'
const POINT_ONE_CHECK_DISPLAY_NAME = 'Slot 1 X/Y-axis'
const POINT_TWO_CHECK_DISPLAY_NAME = 'Slot 3 X/Y-axis'
const POINT_THREE_CHECK_DISPLAY_NAME = 'Slot 7 X/Y-axis'

const stepDisplayNameMap: { [RobotCalibrationCheckStep]: string, ... } = {
  [Calibration.CHECK_STEP_COMPARING_FIRST_PIPETTE_HEIGHT]: HEIGHT_CHECK_DISPLAY_NAME,
  [Calibration.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_ONE]: POINT_ONE_CHECK_DISPLAY_NAME,
  [Calibration.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_TWO]: POINT_TWO_CHECK_DISPLAY_NAME,
  [Calibration.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_THREE]: POINT_THREE_CHECK_DISPLAY_NAME,
  [Calibration.CHECK_STEP_COMPARING_SECOND_PIPETTE_HEIGHT]: HEIGHT_CHECK_DISPLAY_NAME,
  [Calibration.CHECK_STEP_COMPARING_SECOND_PIPETTE_POINT_ONE]: POINT_ONE_CHECK_DISPLAY_NAME,
}

type PipetteComparisonsProps = {|
  pipette: RobotCalibrationCheckInstrument,
  comparisonsByStep: RobotCalibrationCheckComparisonsByStep,
|}

export function PipetteComparisons(props: PipetteComparisonsProps): React.Node {
  const { pipette, comparisonsByStep } = props

  const { displayName } = getPipetteModelSpecs(pipette.model) || {}
  return (
    <div className={styles.pipette_data_wrapper}>
      <h5 className={styles.pipette_data_header}>
        {`${pipette.mount.toLowerCase()} ${PIPETTE}: ${displayName}`}
        {/* <p>{`(TODO: put pipette serial here)`}</p> */}
      </h5>
      <table className={styles.pipette_data_table}>
        <thead>
          <tr>
            <th>{POSITION}</th>
            <th>{STATUS}</th>
            <th>{TOLERANCE_RANGE}</th>
            <th>{DIFFERENCE}</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(comparisonsByStep).map(
            (step: RobotCalibrationCheckStep) => {
              const {
                exceedsThreshold,
                thresholdVector,
                differenceVector,
              } = comparisonsByStep[step]
              const passedCheck = !exceedsThreshold
              return (
                <tr key={step}>
                  <td>{stepDisplayNameMap[step]}</td>
                  <td>
                    <div className={styles.inline_step_status}>
                      <Icon
                        name={passedCheck ? 'check-circle' : 'close-circle'}
                        className={cx(styles.summary_icon, {
                          [styles.success_status_icon]: passedCheck,
                          [styles.error_status_icon]: !passedCheck,
                        })}
                      />
                      {passedCheck ? PASS : FAIL}
                    </div>
                  </td>
                  <td>
                    <ThresholdValue thresholdVector={thresholdVector} />
                  </td>
                  <td>
                    <DifferenceValue
                      differenceVector={differenceVector}
                      stepName={step}
                    />
                  </td>
                </tr>
              )
            }
          )}
        </tbody>
      </table>
    </div>
  )
}
