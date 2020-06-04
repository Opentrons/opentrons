// @flow
import * as React from 'react'
import { SecondaryButton, Link } from '@opentrons/components'

import styles from './styles.css'

const INTRO_TIP_LENGTH_CAL_HEADER = 'Tip length calibration'
const INTRO_TIP_LENGTH_CAL_BODY =
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

const SUPPORT_URL = 'https://www.opentrons.com/contact-support'

type IntroductionProps = {||}
export function Introduction(props: IntroductionProps): React.Node {
  return (
    <>
      <div className={styles.modal_header}>
        <h3>{INTRO_TIP_LENGTH_CAL_HEADER}</h3>
      </div>
      <p className={styles.complete_body}>{INTRO_TIP_LENGTH_CAL_BODY}</p>
      <div>
        <div>
          <p>
            {PREREQS}
            &nbsp;
            <b>{CALIBRATION_BLOCK}</b>
          </p>
          <p>
            {IF_NO_BLOCK}
            &nbsp;
            <Link href={SUPPORT_URL} external>
              {CONTACT_US}
            </Link>
            &nbsp;
            {TO_RECEIVE}
          </p>
          <p>{ALTERNATIVE}</p>
        </div>
        <div>{/*  TODO: insert image of calibration block here */}</div>
      </div>
      <div className={styles.button_row}>
        <SecondaryButton onClick={() => console.log('TODO: handle use block')}>
          {HAVE_BLOCK}
        </SecondaryButton>
        <SecondaryButton
          onClick={() => console.log('TODO: handle use trash edge')}
        >
          {USE_TRASH}
        </SecondaryButton>
      </div>
    </>
  )
}
