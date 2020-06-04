// @flow
import * as React from 'react'
import cx from 'classnames'
import { Icon, PrimaryButton, IconButton } from '@opentrons/components'
import type {
  RobotCalibrationCheckStep,
  RobotCalibrationCheckComparison,
} from '../../calibration'
import styles from './styles.css'

const DELETE_ROBOT_CALIBRATION_CHECK_HEADER =
  'Robot calibration check is complete'
const DELETE_ROBOT_CALIBRATION_CHECK_BUTTON_TEXT = 'Drop tip and exit'
const CHECK = 'check'
const CHECKS = 'checks'
const PASSED = 'passed'
const FAILED = 'failed'

type CompleteConfirmationProps = {|
  exit: () => mixed,
  stepsPassed: number,
  stepsFailed: number,
  // TODO: remove raw data from props after UAT
  comparisonsByStep: {
    [RobotCalibrationCheckStep]: RobotCalibrationCheckComparison,
  },
|}
export function CompleteConfirmation(
  props: CompleteConfirmationProps
): React.Node {
  const { exit, stepsPassed, stepsFailed, comparisonsByStep } = props
  const rawDataRef = React.useRef<HTMLInputElement | null>(null)
  const handleCopyButtonClick = () => {
    console.log(rawDataRef.current)
    if (rawDataRef.current) {
      rawDataRef.current.select()
      document.execCommand('copy')
    }
  }
  return (
    <>
      <div className={styles.modal_icon_wrapper}>
        <h3>{DELETE_ROBOT_CALIBRATION_CHECK_HEADER}</h3>
      </div>
      <div className={styles.complete_summary}>
        {stepsPassed > 0 && (
          <div className={cx(styles.summary_section, styles.passed)}>
            <Icon
              name="check-circle"
              className={cx(styles.success_status_icon, styles.summary_icon)}
            />
            <p className={styles.complete_body_passed}>
              {`${stepsPassed} ${stepsPassed > 1 ? CHECKS : CHECK} ${PASSED}`}
            </p>
          </div>
        )}
        {stepsFailed > 0 && (
          <div className={cx(styles.summary_section, styles.failed)}>
            <Icon
              name="close-circle"
              className={cx(styles.error_status_icon, styles.summary_icon)}
            />
            <p className={styles.complete_body_failed}>
              {`${stepsFailed} ${stepsFailed > 1 ? CHECKS : CHECK} ${FAILED}`}
            </p>
          </div>
        )}
      </div>
      <div className={styles.raw_data_wrapper}>
        {/* TODO: the contents of this div are for testing purposes only remove post UAT */}
        <table className={styles.raw_data_table}>
          <thead>
            <tr>
              <th>Step</th>
              <th>Failed</th>
              <th>Threshold</th>
              <th>Difference</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(comparisonsByStep).map(step => {
              const comparison = comparisonsByStep[step]
              const formatFloat = float => parseFloat(float).toFixed(2)
              const formatVector = vector => {
                return `(${formatFloat(vector[0])}, ${formatFloat(
                  vector[1]
                )}, ${formatFloat(vector[2])})`
              }
              return (
                <tr
                  key={step}
                  className={
                    comparison.exceedsThreshold
                      ? styles.failed_row
                      : styles.passed_row
                  }
                >
                  <td>{step.replace('comparing', '')}</td>
                  <td>{comparison.exceedsThreshold ? 'true' : 'false'}</td>
                  <td>{formatVector(comparison.thresholdVector)}</td>
                  <td>{formatVector(comparison.differenceVector)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
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
      <PrimaryButton onClick={exit}>
        {DELETE_ROBOT_CALIBRATION_CHECK_BUTTON_TEXT}
      </PrimaryButton>
    </>
  )
}
