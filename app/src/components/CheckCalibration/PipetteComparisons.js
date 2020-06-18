// @flow
import * as React from 'react'
import cx from 'classnames'
import {
  Icon,
  Tooltip,
  useHoverTooltip,
  TOOLTIP_TOP,
} from '@opentrons/components'
import { getPipetteModelSpecs } from '@opentrons/shared-data'
import type {
  RobotCalibrationCheckInstrument,
  RobotCalibrationCheckStep,
  RobotCalibrationCheckComparison,
  RobotCalibrationCheckComparisonsByStep,
} from '../../calibration'
import * as Calibration from '../../calibration'
import { DifferenceValue } from './DifferenceValue'
import { ThresholdValue } from './ThresholdValue'
import styles from './styles.css'

const PASS = 'pass'
const FAIL = 'fail'
const INCOMPLETE = 'incomplete'
const NA = 'N/A'

const PIPETTE = 'pipette'
const POSITION = 'position'
const STATUS = 'status'
const TOLERANCE_RANGE = 'tolerance range'
const DIFFERENCE = 'difference'
const DIFFERENCE_TOOLTIP =
  'The difference between jogged tip position and saved calibration coordinate.'

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
  allSteps: Array<RobotCalibrationCheckStep>,
|}

export function PipetteComparisons(props: PipetteComparisonsProps): React.Node {
  const { pipette, comparisonsByStep, allSteps } = props

  const { displayName } = getPipetteModelSpecs(pipette.model) || {}

  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_TOP,
  })
  return (
    <div className={styles.pipette_data_wrapper}>
      <h5 className={styles.pipette_data_header}>
        {`${pipette.mount.toLowerCase()} ${PIPETTE}: ${displayName}`}
        &nbsp;
        <p className={styles.pipette_serial}>{`(#${pipette.serial})`}</p>
      </h5>
      <table className={styles.pipette_data_table}>
        <thead>
          <tr>
            <th>{POSITION}</th>
            <th>{STATUS}</th>
            <th>{TOLERANCE_RANGE}</th>
            <th>
              <span {...targetProps}>{DIFFERENCE}</span>
            </th>
            <Tooltip {...tooltipProps}>{DIFFERENCE_TOOLTIP}</Tooltip>
          </tr>
        </thead>
        <tbody>
          {allSteps.map((step: RobotCalibrationCheckStep) => {
            const comparison = comparisonsByStep[step]
            return (
              <tr key={step}>
                <td>{stepDisplayNameMap[step]}</td>
                <td>
                  <StepStatus comparison={comparison} />
                </td>
                <td>
                  {comparison ? (
                    <ThresholdValue
                      thresholdVector={comparison.thresholdVector}
                    />
                  ) : (
                    NA
                  )}
                </td>
                <td>
                  {comparison ? (
                    <DifferenceValue
                      differenceVector={comparison.differenceVector}
                      stepName={step}
                    />
                  ) : (
                    NA
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

type StepStatusProps = {|
  comparison: RobotCalibrationCheckComparison | null,
|}

const StepStatus = (props: StepStatusProps): React.Node => {
  if (props.comparison) {
    const passedCheck = !props.comparison.exceedsThreshold
    return (
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
    )
  } else {
    return <div className={styles.inline_step_status}>{INCOMPLETE}</div>
  }
}
