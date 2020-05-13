// @flow
import * as React from 'react'
import { Icon, PrimaryButton } from '@opentrons/components'
import styles from './styles.css'

const BAD_ROBOT_CALIBRATION_CHECK_HEADER = 'Bad calibration data detected'
const SUMMARY =
  'Robot is unable to continue checking calibration, as a result of bad calibration data which is likely to cause a crash.'
const REASON =
  'Based on the current co-ordinates of the pipette relative to the tip rack, the specified position is significantly off from the expected location of the target tip position for a standard Opentrons tip in this slot.'
const ENSURE_TIPS_CORRECT =
  'Please ensure you are using the correct Opentrons-brand tips, as an incorrect tip can also cause this error'
const PERFORM_CALIBRATION =
  'Please perform a deck transform calibration on this robot. View'
const THIS_ARTICLE = 'this article'
const LEARN_MORE = 'to learn more'
const BAD_ROBOT_CALIBRATION_CHECK_BUTTON_TEXT =
  'Drop tip and exit calibration check'

// TODO: BC: Immediately confirm actual link
const DECK_CAL_ARTICLE_URL =
  'https://support.opentrons.com/en/articles/3499692-calibrating-your-ot-2'

type CompleteConfirmationProps = {|
  exit: () => mixed,
|}
export function BadCalibration(props: CompleteConfirmationProps) {
  const { exit } = props

  return (
    <div className={styles.padded_contents_wrapper}>
      <div className={styles.modal_icon_wrapper}>
        <Icon name="close-circle" className={styles.error_status_icon} />
        <h3>{BAD_ROBOT_CALIBRATION_CHECK_HEADER}</h3>
      </div>
      <div className={styles.bad_cal_body}>
        <p className={styles.error_explanation}>{SUMMARY}</p>
        <p className={styles.error_explanation}>{REASON}</p>
        <p className={styles.error_explanation}>{ENSURE_TIPS_CORRECT}</p>
        <p className={styles.error_explanation}>
          {PERFORM_CALIBRATION}
          &nbsp;
          <a
            href={DECK_CAL_ARTICLE_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            {THIS_ARTICLE}
          </a>
          &nbsp;
          {LEARN_MORE}
        </p>
      </div>
      <PrimaryButton onClick={exit}>
        {BAD_ROBOT_CALIBRATION_CHECK_BUTTON_TEXT}
      </PrimaryButton>
    </div>
  )
}
