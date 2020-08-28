// @flow
import * as React from 'react'
import {
  Box,
  Flex,
  SPACING_2,
  SPACING_3,
  DIRECTION_ROW,
  DIRECTION_COLUMN,
  FONT_SIZE_BODY_1,
  ALIGN_FLEX_START,
  POSITION_RELATIVE,
  Link,
  PrimaryButton,
  Text,
  useConditionalConfirm,
} from '@opentrons/components'

import * as Sessions from '../../sessions'
import styles from './styles.css'
import { labwareImages } from './labwareImages'
import { getLatestLabwareDef } from '../../getLabware'
import { Portal } from '../portal'
import { ConfirmClearDeckModal } from './ConfirmClearDeckModal'
import type { CalibrationPanelProps } from './types'

const LABWARE_LIBRARY_PAGE_PATH = 'https://labware.opentrons.com'

const DECK_CAL_INTRO_BODY =
  'Deck calibration ensures positional accuracy so that your robot moves as expected. It will accurately establish the OT-2’s deck orientation relative to the gantry.'
const DECK_CALIBRATION_INTRO_HEADER = 'deck calibration'

const LABWARE_REQS = 'For this process you will require:'
const NOTE_HEADER = 'Please note:'
const IT_IS = "It's"
const EXTREMELY = 'extremely'
const NOTE_BODY =
  'important you perform this calibration using the exact tips specified in your protocol, as the robot uses the corresponding labware definition data to find the tip.'
const VIEW_TIPRACK_MEASUREMENTS = 'View measurements'

const CONTINUE = 'Continue to calibrate deck'

export function Introduction(props: CalibrationPanelProps): React.Node {
  const { tipRack, sendSessionCommand } = props

  const { showConfirmation, confirm: proceed, cancel } = useConditionalConfirm(
    () => {
      sendSessionCommand(Sessions.sharedCalCommands.LOAD_LABWARE)
    },
    true
  )

  return (
    <>
      <Flex
        marginY={SPACING_2}
        flexDirection={DIRECTION_COLUMN}
        alignItems={ALIGN_FLEX_START}
        position={POSITION_RELATIVE}
      >
        <h3 className={styles.intro_header}>{DECK_CALIBRATION_INTRO_HEADER}</h3>
        <p className={styles.intro_content}>{DECK_CAL_INTRO_BODY}</p>
        <h5>{LABWARE_REQS}</h5>
        <Flex flexDirection={DIRECTION_ROW} marginTop={SPACING_3}>
          <RequiredLabwareCard loadName={tipRack.loadName} />
        </Flex>
        <Box fontSize={FONT_SIZE_BODY_1} marginY={SPACING_3}>
          <Text>
            <b className={styles.tipracks_note_header}>{`${NOTE_HEADER} `}</b>
            {IT_IS}
            <u>{` ${EXTREMELY} `}</u>
            {NOTE_BODY}
          </Text>
        </Box>
      </Flex>
      <Flex width="100%">
        <PrimaryButton onClick={proceed} className={styles.continue_button}>
          {CONTINUE}
        </PrimaryButton>
      </Flex>
      {showConfirmation && (
        <Portal>
          <ConfirmClearDeckModal confirm={proceed} cancel={cancel} />
        </Portal>
      )}
    </>
  )
}

type RequiredLabwareCardProps = {| loadName: string |}

function RequiredLabwareCard(props: RequiredLabwareCardProps) {
  const { loadName } = props
  return (
    <div className={styles.required_tiprack}>
      <div className={styles.tiprack_image_container}>
        <img className={styles.tiprack_image} src={labwareImages[loadName]} />
      </div>
      <p className={styles.tiprack_display_name}>
        {getLatestLabwareDef(loadName)?.metadata.displayName}
      </p>
      <Link
        external
        className={styles.tiprack_measurements_link}
        href={`${LABWARE_LIBRARY_PAGE_PATH}/${loadName}`}
      >
        {VIEW_TIPRACK_MEASUREMENTS}
      </Link>
    </div>
  )
}
