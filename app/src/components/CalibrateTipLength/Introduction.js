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
} from '@opentrons/components'

import * as Sessions from '../../sessions'
import styles from './styles.css'
import type { CalibrateTipLengthChildProps } from './types'
import { labwareImages } from './labwareImages'
import { getLatestLabwareDef } from '../../getLabware'
import { ToolSettingAlertModal } from './ToolSettingAlertModal'

const LABWARE_LIBRARY_PAGE_PATH = 'https://labware.opentrons.com'

const TIP_LENGTH_CAL_INTRO_BODY =
  "Tip length calibration measures the length of the pipette's tip separately from the pipette's nozzle."

const LABWARE_REQS = 'For this process you will require:'
const NOTE_HEADER = 'Please note:'
const IT_IS = "It's"
const EXTREMELY = 'extremely'
const NOTE_BODY =
  'important you perform this calibration using the exact tips specified in your protocol, as the robot uses the corresponding labware definition data to find the tip.'
const VIEW_TIPRACK_MEASUREMENTS = 'View measurements'

const CONTINUE = 'Continue to tip length calibration'

const TIP_LENGTH_CALIBRATION_INTRO_HEADER = 'tip length calibration'

export function Introduction(props: CalibrateTipLengthChildProps): React.Node {
  const { labware, sendSessionCommand } = props
  const tipRacksFirst = labware.sort((a, b) => (a.isTiprack ? -1 : 1))

  return (
    <>
      <Flex
        marginY={SPACING_2}
        flexDirection={DIRECTION_COLUMN}
        alignItems={ALIGN_FLEX_START}
        position={POSITION_RELATIVE}
      >
        <h3 className={styles.intro_header}>
          {TIP_LENGTH_CALIBRATION_INTRO_HEADER}
        </h3>
        <p className={styles.intro_content}>{TIP_LENGTH_CAL_INTRO_BODY}</p>
        <h5>{LABWARE_REQS}</h5>
        <Flex flexDirection={DIRECTION_ROW} marginTop={SPACING_3}>
          {tipRacksFirst.map((l, i) => (
            <RequiredLabwareCard
              key={`${l.loadName}${i}`}
              loadName={l.loadName}
              isTiprack={l.isTiprack}
            />
          ))}
        </Flex>
        <Box fontSize={FONT_SIZE_BODY_1} marginY={SPACING_3}>
          <Text>
            <b className={styles.tipracks_note_header}>{NOTE_HEADER}</b>
            &nbsp;
            {IT_IS}
            &nbsp;
            <u>{EXTREMELY}</u>
            &nbsp;
            {NOTE_BODY}
          </Text>
        </Box>
      </Flex>
      <div className={styles.button_row}>
        <PrimaryButton
          onClick={() =>
            sendSessionCommand(Sessions.tipCalCommands.LOAD_LABWARE)
          }
          className={styles.continue_button}
        >
          {CONTINUE}
        </PrimaryButton>
      </div>
    </>
  )
}

type RequiredLabwareCardProps = {| loadName: string, isTiprack: boolean |}

function RequiredLabwareCard(props: RequiredLabwareCardProps) {
  const { loadName, isTiprack } = props
  return (
    <div className={styles.required_tiprack}>
      <div className={styles.tiprack_image_container}>
        <img className={styles.tiprack_image} src={labwareImages[loadName]} />
      </div>
      <p className={styles.tiprack_display_name}>
        {getLatestLabwareDef(loadName)?.metadata.displayName}
      </p>
      {isTiprack && (
        <Link
          external
          className={styles.tiprack_measurements_link}
          href={`${LABWARE_LIBRARY_PAGE_PATH}/${loadName}`}
        >
          {VIEW_TIPRACK_MEASUREMENTS}
        </Link>
      )}
    </div>
  )
}
