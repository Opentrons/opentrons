// @flow
import * as React from 'react'
import cx from 'classnames'
import { Icon, PrimaryButton, IconButton } from '@opentrons/components'
import { getPipetteModelSpecs } from '@opentrons/shared-data'
import find from 'lodash/find'
import pick from 'lodash/pick'
import some from 'lodash/some'
import partition from 'lodash/partition'
import type {
  RobotCalibrationCheckStep,
  RobotCalibrationCheckComparison,
  RobotCalibrationCheckComparisonsByStep,
  RobotCalibrationCheckInstrument,
} from '../../calibration'
import * as Calibration from '../../calibration'
import styles from './styles.css'

const ROBOT_CALIBRATION_CHECK_SUMMARY_HEADER = 'Calibration check summary:'
const DROP_TIP_AND_EXIT = 'Drop tip in trash and exit'
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

type CompleteConfirmationProps = {|
  exit: () => mixed,
  comparisonsByStep: {
    [RobotCalibrationCheckStep]: RobotCalibrationCheckComparison,
  },
  instrumentsByMount: { [mount: string]: RobotCalibrationCheckInstrument, ... },
|}
export function CompleteConfirmation(
  props: CompleteConfirmationProps
): React.Node {
  const { exit, comparisonsByStep, instrumentsByMount } = props

  // const stepsPassed = Object.keys(comparisonsByStep).reduce((acc, step) => {
  //   return acc + (comparisonsByStep[step].exceedsThreshold ? 0 : 1)
  // }, 0)
  // const stepsFailed = Object.keys(comparisonsByStep).length - stepsPassed

  const rawDataRef = React.useRef<HTMLInputElement | null>(null)
  const handleCopyButtonClick = () => {
    console.log(rawDataRef.current)
    if (rawDataRef.current) {
      rawDataRef.current.select()
      document.execCommand('copy')
    }
  }

  const firstPipette = find(
    instrumentsByMount,
    (p: RobotCalibrationCheckInstrument) =>
      p.rank === Calibration.CHECK_PIPETTE_RANK_FIRST
  )
  const secondPipette = find(
    instrumentsByMount,
    (p: RobotCalibrationCheckInstrument) =>
      p.rank === Calibration.CHECK_PIPETTE_RANK_SECOND
  )
  const [firstComparisonsByStep, secondComparisonsByStep] = partition(
    Object.keys(comparisonsByStep),
    compStep => Calibration.FIRST_PIPETTE_COMPARISON_STEPS.includes(compStep)
  ).map(stepNames => pick(comparisonsByStep, stepNames))

  console.log(
    firstPipette,
    secondPipette,
    firstComparisonsByStep,
    secondComparisonsByStep
  )
  return (
    <>
      <div className={styles.modal_icon_wrapper}>
        <h3>{ROBOT_CALIBRATION_CHECK_SUMMARY_HEADER}</h3>
      </div>

      <div className={styles.summary_page_contents}>
        {some(firstComparisonsByStep) && (
          <PipetteStepsSummary
            pipette={firstPipette}
            comparisonsByStep={firstComparisonsByStep}
          />
        )}
        {some(secondComparisonsByStep) && (
          <PipetteStepsSummary
            pipette={secondPipette}
            comparisonsByStep={secondComparisonsByStep}
          />
        )}

        <input
          ref={rawDataRef}
          type="text"
          value={JSON.stringify(comparisonsByStep)}
          onFocus={e => e.currentTarget.select()}
          readOnly
        />

        <IconButton
          className={styles.copy_icon}
          onClick={handleCopyButtonClick}
          name="ot-copy-text"
        />
      </div>
      <PrimaryButton onClick={exit}>{DROP_TIP_AND_EXIT}</PrimaryButton>
    </>
  )
}

const stepDisplayNameMap: { [RobotCalibrationCheckStep]: string, ... } = {
  [Calibration.CHECK_STEP_COMPARING_FIRST_PIPETTE_HEIGHT]: HEIGHT_CHECK_DISPLAY_NAME,
  [Calibration.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_ONE]: POINT_ONE_CHECK_DISPLAY_NAME,
  [Calibration.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_TWO]: POINT_TWO_CHECK_DISPLAY_NAME,
  [Calibration.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_THREE]: POINT_THREE_CHECK_DISPLAY_NAME,
  [Calibration.CHECK_STEP_COMPARING_SECOND_PIPETTE_HEIGHT]: HEIGHT_CHECK_DISPLAY_NAME,
  [Calibration.CHECK_STEP_COMPARING_SECOND_PIPETTE_POINT_ONE]: POINT_ONE_CHECK_DISPLAY_NAME,
}

const axisIndicesByStep: { [RobotCalibrationCheckStep]: Array<number>, ... } = {
  [Calibration.CHECK_STEP_COMPARING_FIRST_PIPETTE_HEIGHT]: [2],
  [Calibration.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_ONE]: [0, 1],
  [Calibration.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_TWO]: [0, 1],
  [Calibration.CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_THREE]: [0, 1],
  [Calibration.CHECK_STEP_COMPARING_SECOND_PIPETTE_HEIGHT]: [2],
  [Calibration.CHECK_STEP_COMPARING_SECOND_PIPETTE_POINT_ONE]: [0, 1],
}
const AXIS_NAMES = ['X', 'Y', 'Z']
type PipetteStepsSummaryProps = {|
  pipette: RobotCalibrationCheckInstrument,
  comparisonsByStep: {
    [RobotCalibrationCheckStep]: RobotCalibrationCheckComparison,
  },
|}

function PipetteStepsSummary(props: PipetteStepsSummaryProps) {
  const { pipette, comparisonsByStep } = props

  const { displayName } = getPipetteModelSpecs(pipette.model) || {}
  return (
    <div className={styles.pipette_data_wrapper}>
      <div className={styles.pipette_data_header}>
        <h5>{`${pipette.mount.toLowerCase()} ${PIPETTE}: ${displayName}`}</h5>
        {/* <p>{`(TODO: put pipette serial here)`}</p> */}
      </div>
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
          {Object.keys(comparisonsByStep).map(step => {
            const comparison = comparisonsByStep[step]
            const formatFloat = float => parseFloat(float).toFixed(2)
            const formatThreshold = vector => {
              const value = vector.find(axis => axis > 0)
              return `±${formatFloat(value)} mm`
            }
            const formatDifference = vector => {
              console.log(vector)
              return axisIndicesByStep[step].map(axisIndex => (
                <span className={styles.data_axis_label}>
                  <span>{AXIS_NAMES[axisIndex]}</span>
                  &nbsp; &nbsp;
                  <span>
                    {vector[axisIndex] !== 0
                      ? vector[axisIndex] > 0
                        ? '+'
                        : '-'
                      : ' '}
                  </span>
                  <span>{vector[axisIndex]} mm</span>
                </span>
              ))
            }
            const passedCheck = !comparison.exceedsThreshold
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
                <td>{formatThreshold(comparison.thresholdVector)}</td>
                <td>{formatDifference(comparison.differenceVector)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
