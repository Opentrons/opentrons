// @flow
import * as React from 'react'
import { Icon, PrimaryButton, Link } from '@opentrons/components'
import styles from './styles.css'

const BAD_ROBOT_CALIBRATION_CHECK_HEADER = 'Unable to check robot calibration'
const SUMMARY =
  "Your pipette tip pick-up location does not match its calibrated location. This may occur if the tip rack is out of place, or if your robot's deck is out of calibration"
const TO_TROUBLESHOOT = 'To troubleshoot this issue:'
const TIP_RACK_CENTERED = 'Confirm your tip rack is centered in its slot'
const USE_OPENTRONS_TIPS = 'Confirm you are using Opentrons brand tips'
const PERFORM_CALIBRATION =
  'If you continue to see this error, exit calibration check and complete a deck calibration. View'
const THIS_ARTICLE = 'this article'
const LEARN_MORE = 'to learn more'
const BAD_ROBOT_CALIBRATION_CHECK_BUTTON_TEXT =
  'Drop tip and exit robot calibration check'

const DECK_CAL_ARTICLE_URL =
  'https://support.opentrons.com/en/articles/2687620-get-started-calibrate-the-deck'
type CompleteConfirmationProps = {|
  exit: () => mixed,
|}
export function BadCalibration(props: CompleteConfirmationProps): React.Node {
  const { exit } = props

  return (
    <div className={styles.padded_contents_wrapper}>
      <div className={styles.modal_icon_wrapper}>
        <Icon name="close-circle" className={styles.error_status_icon} />
        <h3>{BAD_ROBOT_CALIBRATION_CHECK_HEADER}</h3>
      </div>
      <div className={styles.bad_cal_body}>
        <p className={styles.error_explanation}>{SUMMARY}</p>
        <p className={styles.error_explanation}>{TO_TROUBLESHOOT}</p>
        <ul>
          <li className={styles.error_explanation}>{TIP_RACK_CENTERED}</li>
          <li className={styles.error_explanation}>{USE_OPENTRONS_TIPS}</li>
        </ul>
        <p className={styles.error_explanation}>
          {PERFORM_CALIBRATION}
          &nbsp;
          <Link href={DECK_CAL_ARTICLE_URL} external>
            {THIS_ARTICLE}
          </Link>
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
