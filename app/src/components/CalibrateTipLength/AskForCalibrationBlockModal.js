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
  JUSTIFY_SPACE_BETWEEN,
  SPACING_4,
} from '@opentrons/components'

import styles from './styles.css'
import { labwareImages } from '../CalibrationPanels/labwareImages'
import { NeedHelpLink } from '../CalibrationPanels/NeedHelpLink'

const EXIT = 'exit'
const ALERT_TIP_LENGTH_CAL_HEADER = 'Do you have a calibration block?'
const ALERT_TIP_LENGTH_CAL_BODY =
  'This block is a specially-made tool that fits perfectly in your deck, and helps with calibration.'
const IF_NO_BLOCK = 'If you do not have a Calibration Block please'
const CONTACT_US = 'contact us'
const TO_RECEIVE = 'so we can send you one.'
const ALTERNATIVE =
  'While you wait for the block to arrive, you may use the flat surface on the Trash Bin of your robot instead.'
const HAVE_BLOCK = 'Continue with calibration block'
const USE_TRASH = 'Use trash bin'
const REMEMBER = "Remember my selection for next time and don't ask again"
const BLOCK_REQUEST_URL = 'https://opentrons-ux.typeform.com/to/DgvBE9Ir'
const CAL_BLOCK_LOAD_NAME = 'opentrons_calibrationblock_short_side_right'

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
        <Flex width="100%" justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Text css={FONT_HEADER_DARK} marginBottom={SPACING_3}>
            {ALERT_TIP_LENGTH_CAL_HEADER}
          </Text>
          <NeedHelpLink />
        </Flex>
        <Flex
          justifyContent={JUSTIFY_CENTER}
          marginTop={SPACING_4}
          marginBottom={SPACING_3}
        >
          <img
            className={styles.block_image}
            src={labwareImages[CAL_BLOCK_LOAD_NAME]}
          />
        </Flex>
        <Box fontSize={FONT_SIZE_BODY_2} marginY={SPACING_4}>
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
          <Text marginBottom={SPACING_4}>{ALTERNATIVE}</Text>
        </Box>
        <Box marginX="1rem">
          <Flex marginLeft="1px" marginBottom={SPACING_3}>
            <CheckboxField
              label={REMEMBER}
              onChange={e => setRememberPreference(e.currentTarget.checked)}
              value={rememberPreference}
            />
          </Flex>
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
        </Box>
      </Flex>
    </ModalPage>
  )
}
