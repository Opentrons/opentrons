// @flow
import * as React from 'react'
import {
  AlertModal,
  CheckboxField,
  Link,
  OutlineButton,
  PrimaryButton,
} from '@opentrons/components'

import styles from './styles.css'
import type { CalibrateTipLengthChildProps } from './types'
import { tiprackImages, calBlockImage } from './labwareImages'
import { getLatestLabwareDef } from '../../getLabware'

const LABWARE_LIBRARY_PAGE_PATH = 'https://labware.opentrons.com'

const TIP_LENGTH_CAL_INTRO_BODY =
  'Tip length calibration measures your tip separately from your nozzle.'

const LABWARE_REQS = 'For this process you will require:'
const NOTE_HEADER = 'Please note:'
const IT_IS = "It's"
const EXTREMELY = 'extremely'
const NOTE_BODY =
  'important you perform this calibration using the exact tips specified in your protocol, as the robot uses the corresponding labware definition data to find the tip.'
const VIEW_TIPRACK_MEASUREMENTS = 'View measurements'

const CONTINUE = 'Continue to tip length calibration'

const ALERT_TIP_LENGTH_CAL_HEADER = 'Pipette calibration has been updated!'
const ALERT_TIP_LENGTH_CAL_BODY =
  'The Tip Probe feature of the robot is no longer being used. We’ve replaced it with a new process that allows the robot to measure the length of a tip relative to how it fits on the nozzle of the pipette. The data is saved per pipette model, so that each pipette model can save unique tip length data.'
const PREREQS = 'To perform this new calibration process, you will require a'
const CALIBRATION_BLOCK = 'Calibration Block.'
const IF_NO_BLOCK = 'If you do not have a Calibration Block please'
const CONTACT_US = 'contact us'
const TO_RECEIVE = 'to receive one.'
const ALTERNATIVE =
  'While you wait for the block to arrive, you may opt in to using the flat surface on the Trash Bin of your robot instead.'
const HAVE_BLOCK = 'I have a calibration block'
const USE_TRASH = 'Use trash bin for now'
const REMEMBER = "Remember my selection and don't ask again"
const CAN_CHANGE =
  '(You can change this selection under More > Robots > Advanced Settings)'

const SUPPORT_URL = 'https://www.opentrons.com/contact-support'

export function Introduction(props: CalibrateTipLengthChildProps): React.Node {
  const { haveBlock, mount, session } = props
  const tiprackID =
    session.details.instruments[mount.toLowerCase()]['tiprack_id']
  const tiprack = session.details.labware.find(l => l.id === tiprackID)

  // TODO: get target labware based on alert modal selection or robot block setting
  const targetLabwareName = 'Opentrons Calibration Block'

  return (
    <>
      <div className={styles.tiplengthcal_intro_div}>
        <p className={styles.intro_content}>{TIP_LENGTH_CAL_INTRO_BODY}</p>
      </div>
      <h5>{LABWARE_REQS}</h5>
      <div className={styles.required_tipracks_wrapper}>
        <div key={tiprack.loadName} className={styles.required_tiprack}>
          <div
            key={tiprack.loadName}
            className={styles.tiprack_image_container}
          >
            <img
              className={styles.tiprack_image}
              src={tiprackImages[tiprack.loadName]}
            />
          </div>
          <p className={styles.tiprack_display_name}>
            {getLatestLabwareDef(tiprack.loadName)?.metadata.displayName}
          </p>
          <a
            className={styles.tiprack_measurements_link}
            target="_blank"
            rel="noopener noreferrer"
            href={`${LABWARE_LIBRARY_PAGE_PATH}/${tiprack.loadName}`}
            onClick={e => e.stopPropagation()}
          >
            {VIEW_TIPRACK_MEASUREMENTS}
          </a>
        </div>
        <div key={targetLabwareName} className={styles.required_tiprack}>
          <div
            key={targetLabwareName}
            className={styles.tiprack_image_container}
          >
            <img className={styles.tiprack_image} src={calBlockImage} />
          </div>
          <p className={styles.tiprack_display_name}>{targetLabwareName}</p>
        </div>
      </div>
      <div className={styles.tipracks_note_div}>
        <p className={styles.tipracks_note_body}>
          <b className={styles.tipracks_note_header}>{NOTE_HEADER}</b>
          &nbsp;
          {IT_IS}
          &nbsp;
          <u>{EXTREMELY}</u>
          &nbsp;
          {NOTE_BODY}
        </p>
      </div>
      <div className={styles.button_row}>
        <PrimaryButton className={styles.continue_button}>
          {CONTINUE}
        </PrimaryButton>
      </div>
      {haveBlock ?? (
        <AlertModal iconName={null} heading={ALERT_TIP_LENGTH_CAL_HEADER}>
          <div>
            <p className={styles.intro_content}>{ALERT_TIP_LENGTH_CAL_BODY}</p>
            <div className={styles.required_block}>
              <div>
                <p className={styles.intro_content}>
                  {PREREQS}
                  &nbsp;
                  <b>{CALIBRATION_BLOCK}</b>
                </p>
                <p className={styles.intro_content}>
                  {IF_NO_BLOCK}
                  &nbsp;
                  <Link href={SUPPORT_URL} external>
                    {CONTACT_US}
                  </Link>
                  &nbsp;
                  {TO_RECEIVE}
                </p>
                <p className={styles.intro_content}>{ALTERNATIVE}</p>
              </div>
              <div>
                <img className={styles.block_image} src={calBlockImage} />
              </div>
            </div>
          </div>
          <div className={styles.button_row}>
            <OutlineButton
              className={styles.intro_button}
              onClick={() => console.log('TODO: handle use block')}
            >
              {HAVE_BLOCK}
            </OutlineButton>
            <div className={styles.button_spacer} />
            <OutlineButton
              className={styles.intro_button}
              onClick={() => console.log('TODO: handle use trash edge')}
            >
              {USE_TRASH}
            </OutlineButton>
          </div>
          <div>
            <CheckboxField label={REMEMBER} />
            <p className={styles.intro_settings_note}>{CAN_CHANGE}</p>
          </div>
        </AlertModal>
      )}
    </>
  )
}
