import * as React from 'react'
import {
  Box,
  CheckboxField,
  Flex,
  Link,
  DeprecatedModalPage,
  PrimaryBtn,
  SecondaryBtn,
  Text,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  FONT_HEADER_DARK,
  FONT_BODY_2_DARK,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  SPACING_2,
  SPACING_3,
  SPACING_4,
} from '@opentrons/components'
import { useDispatch } from 'react-redux'

import styles from './styles.css'
import { labwareImages } from '../../organisms/CalibrationPanels/labwareImages'
import { setUseTrashSurfaceForTipCal } from '../../redux/calibration'
import { NeedHelpLink } from '../../organisms/CalibrationPanels/NeedHelpLink'

import type { Dispatch } from '../../redux/types'

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

interface Props {
  onResponse: (hasBlock: boolean) => void
  titleBarTitle: string
  closePrompt: () => void
}
export function AskForCalibrationBlockModal(props: Props): JSX.Element {
  const [rememberPreference, setRememberPreference] = React.useState<boolean>(
    false
  )
  const dispatch = useDispatch<Dispatch>()

  const makeSetHasBlock = (hasBlock: boolean) => (): void => {
    if (rememberPreference) {
      dispatch(setUseTrashSurfaceForTipCal(!hasBlock))
    }
    props.onResponse(hasBlock)
  }

  return (
    <DeprecatedModalPage
      titleBar={{
        title: props.titleBarTitle,
        back: { onClick: props.closePrompt, title: EXIT, children: EXIT },
      }}
      outerProps={{ padding: '4.5rem 1rem 1rem 1rem' }}
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
        <Box css={FONT_BODY_2_DARK} marginY={SPACING_4}>
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
        <Box css={FONT_BODY_2_DARK} marginX="1rem">
          <Flex marginLeft="1px" marginBottom={SPACING_3}>
            <CheckboxField
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setRememberPreference(e.currentTarget.checked)
              }
              value={rememberPreference}
            />
            <Text marginLeft={SPACING_2}>{REMEMBER}</Text>
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
    </DeprecatedModalPage>
  )
}
