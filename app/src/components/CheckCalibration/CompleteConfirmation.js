// @flow
import * as React from 'react'
import cx from 'classnames'
import { Icon, PrimaryButton } from '@opentrons/components'
import styles from './styles.css'

const DELETE_ROBOT_CALIBRATION_CHECK_HEADER = 'Calibration check is complete'
const DELETE_ROBOT_CALIBRATION_CHECK_BUTTON_TEXT = 'Drop tip and exit'
const CHECK = 'check'
const CHECKS = 'checks'
const PASSED = 'passed'
const FAILED = 'failed'

type CompleteConfirmationProps = {|
  exit: () => mixed,
  stepsPassed: number,
  stepsFailed: number,
|}
export function CompleteConfirmation(props: CompleteConfirmationProps) {
  const { exit, stepsPassed, stepsFailed } = props
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
              {stepsPassed}
              &nbsp;
              {stepsPassed > 1 ? CHECKS : CHECK}
              &nbsp;
              {PASSED}
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
              {stepsFailed}
              &nbsp;
              {stepsFailed > 1 ? CHECKS : CHECK}
              &nbsp;
              {FAILED}
            </p>
          </div>
        )}
      </div>

      <PrimaryButton onClick={exit}>
        {DELETE_ROBOT_CALIBRATION_CHECK_BUTTON_TEXT}
      </PrimaryButton>
    </>
  )
}
