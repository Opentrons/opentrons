// @flow
import * as React from 'react'
import { PrimaryButton, AlertModal } from '@opentrons/components'

import { getLatestLabwareDef } from '../../getLabware'
import styles from './styles.css'
import { tiprackImages } from './tiprackImages'

const LABWARE_LIBRARY_PAGE_PATH = 'https://labware.opentrons.com'

const ROBOT_CALIBRATION_INTRO_HEADER =
  'Checking the OT-2’s calibration is a first step towards diagnosing and troubleshooting common pipette positioning problems you may be experiencing.'

const ROBOT_CALIBRATION_INTRO_INSTRUCTION =
  'For this process you will be asked to manually jog each attached pipette to designated positions on the robot’s deck. You will then prompt the robot to check how this positional coordinate compares to your previously saved calibration coordinate. Note that this process does not overwrite your existing calibration data.'

const ROBOT_CALIBRATION_INTRO_OUTCOMES =
  'If the difference between the two coordinates falls within the acceptable tolerance range for the given pipette, the check will pass. Otherwise, it will fail and you’ll be provided with troubleshooting guidance. You may exit at any point or continue through to the end to check the overall calibration status of your robot.'

const TIPRACK_REQS = 'For this process you will require:'
const VIEW_TIPRACK_MEASUREMENTS = 'View measurements'
const NOTE_HEADER = 'Please note: '
const NOTE_BODY =
  "It's important you perform this test using the Opentrons tips and tip racks specified above, as the robot determines accuracy based on the measurements of these tips."
const CANCEL = 'Cancel'
const CONTINUE = 'Continue'
const CLEAR_DECK_HEADER = 'Clear the deck'
const CLEAR_DECK_BODY =
  'Before continuing to check robot calibration, please remove all labware and modules from the deck.'

type IntroductionProps = {|
  labwareLoadNames: Array<string>,
  proceed: () => mixed,
  exit: () => mixed,
|}
export function Introduction(props: IntroductionProps): React.Node {
  const { labwareLoadNames, exit, proceed } = props
  const [clearDeckWarningOpen, setClearDeckWarningOpen] = React.useState(false)

  // TODO: BC: investigate whether we should sub out the warning modal
  // below for the existing ClearDeckAlertModal

  return (
    <>
      <div className={styles.calcheck_intro_div}>
        <p className={styles.intro_header}>{ROBOT_CALIBRATION_INTRO_HEADER}</p>
        <p className={styles.intro_content}>
          {ROBOT_CALIBRATION_INTRO_INSTRUCTION}
        </p>
        <p className={styles.intro_content}>
          {ROBOT_CALIBRATION_INTRO_OUTCOMES}
        </p>
      </div>
      <h5>{TIPRACK_REQS}</h5>
      <div className={styles.required_tipracks_wrapper}>
        {labwareLoadNames.map(loadName => (
          <div key={loadName} className={styles.required_tiprack}>
            <div className={styles.tiprack_image_container}>
              <img
                className={styles.tiprack_image}
                src={tiprackImages[loadName]}
              />
            </div>
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
        {NOTE_BODY}
      </p>
      <div className={styles.button_row}>
        <PrimaryButton
          onClick={() => setClearDeckWarningOpen(true)}
          className={styles.continue_button}
        >
          {CONTINUE}
        </PrimaryButton>
      </div>
      {clearDeckWarningOpen && (
        <AlertModal
          alertOverlay
          heading={CLEAR_DECK_HEADER}
          buttons={[
            { children: CANCEL, onClick: exit },
            { children: CONTINUE, onClick: proceed },
          ]}
        >
          {CLEAR_DECK_BODY}
        </AlertModal>
      )}
    </>
  )
}
