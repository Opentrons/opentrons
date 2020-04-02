// @flow
import * as React from 'react'
import { PrimaryButton } from '@opentrons/components'
import { getLatestLabwareDef } from '../../getLabware'
import styles from './styles.css'
import { tiprackImages } from './tiprackImages'

const LABWARE_LIBRARY_PAGE_PATH = 'https://labware.opentrons.com'

const INTRO_ROBOT_CALIBRATION_CHECK_HEADER = 'Check deck calibration'
const INTRO_ROBOT_CALIBRATION_CHECK_BODY =
  'Testing your deck calibration builds confidence that the robot is working correctly and accurately. If at any point the robot does not go to the points as expected, exit this process and re-calibrate your robot deck.'
const TIPRACK_REQS = 'For this process you will require:'
const VIEW_TIPRACK_MEASUREMENTS = 'View measurements'
const NOTE_HEADER = 'Please note: '
const IMPORTANCE_MODIFIER = 'extremely'
const NOTE_BODY_1 = "It's "
const NOTE_BODY_2 =
  ' important you perform this test using the Opentrons tips and tipracks specified above, as the robot determines accuracy based on the measurements of these tips.'
const INTRO_ROBOT_CALIBRATION_CHECK_BUTTON_TEXT = 'Continue'

type IntroductionProps = {|
  labwareLoadNames: Array<string>,
  proceed: () => mixed,
|}
export function Introduction(props: IntroductionProps) {
  const { labwareLoadNames, proceed } = props

  return (
    <>
      <div className={styles.modal_header}>
        <h3>{INTRO_ROBOT_CALIBRATION_CHECK_HEADER}</h3>
      </div>
      <p className={styles.complete_body}>
        {INTRO_ROBOT_CALIBRATION_CHECK_BODY}
      </p>
      <h5>{TIPRACK_REQS}</h5>
      <div className={styles.required_tipracks_wrapper}>
        {labwareLoadNames.map(loadName => (
          <div key={loadName} className={styles.tiprack_image_container}>
            <img
              className={styles.tiprack_image}
              src={tiprackImages[loadName]}
            />
            <p className={styles.tiprack_display_name}>
              {getLatestLabwareDef(loadName)?.metadata.displayName}
            </p>
            <a
              className={styles.tiprack_measurements_link}
              target="_blank"
              rel="noopener noreferrer"
              href={`${LABWARE_LIBRARY_PAGE_PATH}/${loadName}`}
              onClick={e => e.stopPropagation()}
            >
              {VIEW_TIPRACK_MEASUREMENTS}
            </a>
          </div>
        ))}
      </div>

      <p className={styles.tipracks_note_body}>
        <b className={styles.tipracks_note_header}>{NOTE_HEADER}</b>
        {NOTE_BODY_1}
        <u>{IMPORTANCE_MODIFIER}</u>
        {NOTE_BODY_2}
      </p>
      <div className={styles.button_row}>
        <PrimaryButton onClick={proceed} className={styles.continue_button}>
          {INTRO_ROBOT_CALIBRATION_CHECK_BUTTON_TEXT}
        </PrimaryButton>
      </div>
    </>
  )
}
