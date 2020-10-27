// @flow
import * as React from 'react'
import {
  Box,
  CheckboxField,
  Link,
  SecondaryBtn,
  FONT_HEADER_DARK,
  FONT_SIZE_BODY_1,
  FONT_SIZE_BODY_2,
  SPACING_3,
  Flex,
  Text,
  JUSTIFY_CENTER,
  PrimaryBtn,
  ALIGN_CENTER,
  ModalPage,
  DIRECTION_COLUMN,
} from '@opentrons/components'

import styles from './styles.css'
import { labwareImages } from '../CalibrationPanels/labwareImages'

const EXIT = 'exit'
const ALERT_TIP_LENGTH_CAL_HEADER = 'Do you have a calibration block?'
const ALERT_TIP_LENGTH_CAL_BODY =
  'This block is a specially-made tool that fits perfectly in a deck slot, and helps with calibration.'
const IF_NO_BLOCK = 'If you do not have a Calibration Block please'
const CONTACT_US = 'contact us'
const TO_RECEIVE = 'to receive one.'
const ALTERNATIVE =
  'While you wait for the block to arrive, you may use the flat surface on the Trash Bin of your robot instead.'
const HAVE_BLOCK = 'Continue with calibration block'
const USE_TRASH = 'Use trash bin'
const REMEMBER = "Remember my selection and don't ask again"
const CAN_CHANGE =
  '(You can change this selection under More > Robots > Advanced Settings)'
const BLOCK_REQUEST_URL = 'https://opentrons-ux.typeform.com/to/DgvBE9Ir'
const CAL_BLOCK_LOAD_NAME = 'opentrons_calibrationblock_short_side_right'

const NOTE_SPACING = '1.75rem'

type Props = {|
  titleBarTitle: string,
  closePrompt: () => void,
  setHasBlock: (hasBlock: boolean, rememberPreference: boolean) => void,
|}
export function AskForCalibrationBlockModal(props: Props): React.Node {
  const [rememberPreference, setRememberPreference] = React.useState<boolean>(
    false
  )

  const makeSetHasBlock = hasBlock => () => {
    props.setHasBlock(hasBlock, rememberPreference)
  }

  return (
    <ModalPage
      titleBar={{
        title: props.titleBarTitle,
        back: { onClick: props.closePrompt, title: EXIT, children: EXIT },
      }}
    >
      <Flex flexDirection={DIRECTION_COLUMN} padding={SPACING_3}>
        <Text css={FONT_HEADER_DARK} marginBottom={SPACING_3}>
          {ALERT_TIP_LENGTH_CAL_HEADER}
        </Text>
        <Flex justifyContent={JUSTIFY_CENTER} marginY="1rem">
          <img
            className={styles.block_image}
            src={labwareImages[CAL_BLOCK_LOAD_NAME]}
          />
        </Flex>
        <Box fontSize={FONT_SIZE_BODY_2} marginTop="2rem" marginBottom="4rem">
          <Text marginBottom={SPACING_3}>
            {ALERT_TIP_LENGTH_CAL_BODY}
            &nbsp;
            {IF_NO_BLOCK}
            &nbsp;
            <Link external href={BLOCK_REQUEST_URL} color="inherit">
              <u>{CONTACT_US}</u>
            </Link>
            &nbsp;
            {TO_RECEIVE}
          </Text>
          <Text marginBottom={SPACING_3}>{ALTERNATIVE}</Text>
        </Box>
        <Box marginX="1rem">
          <Flex
            alignSelf={ALIGN_CENTER}
            justifyContent={JUSTIFY_CENTER}
            marginBottom={SPACING_3}
          >
            <SecondaryBtn onClick={makeSetHasBlock(false)}>
              {USE_TRASH}
            </SecondaryBtn>
            <PrimaryBtn onClick={makeSetHasBlock(true)} marginLeft="1rem">
              {HAVE_BLOCK}
            </PrimaryBtn>
          </Flex>
          <Box marginLeft="1px">
            <CheckboxField
              label={REMEMBER}
              onChange={e => setRememberPreference(e.currentTarget.checked)}
              value={rememberPreference}
            />
            <Text fontSize={FONT_SIZE_BODY_1} paddingX={NOTE_SPACING}>
              {CAN_CHANGE}
            </Text>
          </Box>
        </Box>
      </Flex>
    </ModalPage>
  )
}
