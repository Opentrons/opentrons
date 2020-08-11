// @flow
import * as React from 'react'
import {
  Box,
  Flex,
  PrimaryButton,
  Text,
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  BORDER_SOLID_LIGHT,
  DIRECTION_COLUMN,
  FONT_SIZE_BODY_2,
  JUSTIFY_CENTER,
  POSITION_RELATIVE,
  SPACING_2,
  SPACING_3,
  TEXT_ALIGN_CENTER,
} from '@opentrons/components'
import { getLabwareDisplayName } from '@opentrons/shared-data'

import * as Sessions from '../../sessions'
import type { JogAxis, JogDirection, JogStep } from '../../http-api-client'
import { getLatestLabwareDef } from '../../getLabware'
import { JogControls } from '../JogControls'
import type { CalibrateDeckChildProps } from './types'
import styles from './styles.css'
import { formatJogVector } from './utils'

// TODO: put these assets in a shared location
import multiDemoAsset from '../CheckCalibration/videos/A1_Multi_Channel_REV1.webm'
import singleDemoAsset from '../CheckCalibration/videos/A1_Single_Channel_REV1.webm'

const TIP_PICK_UP_HEADER = 'Position pipette over '
const TIP_PICK_UP_BUTTON_TEXT = 'Pick up tip'

const SINGLE_JOG_UNTIL_AT = 'Jog pipette until nozzle is centered above the'
const MULTI_JOG_UNTIL_AT = 'Jog pipette until the channel nozzle'
const CLOSEST = 'closest'
const TO_YOU_IS_CENTERED = 'to you is centered above the'
const POSITION = 'position'
const AND = 'and'
const FLUSH = 'flush'
const WITH_TOP_OF_TIP = 'with the top of the tip.'
const TIP_WELL_NAME = 'A1'

const ASSET_MAP = {
  multi: multiDemoAsset,
  single: singleDemoAsset,
}
export function TipPickUp(props: CalibrateDeckChildProps): React.Node {
  const { sendSessionCommand, tipRack, isMulti } = props

  const tipRackDef = React.useMemo(
    () => getLatestLabwareDef(tipRack?.loadName),
    [tipRack]
  )

  const demoAsset = ASSET_MAP[isMulti ? 'multi' : 'single']

  const jogUntilAbove = isMulti ? (
    <>
      {MULTI_JOG_UNTIL_AT}
      <Text as="strong">{` ${CLOSEST} `}</Text>
      {TO_YOU_IS_CENTERED}
    </>
  ) : (
    SINGLE_JOG_UNTIL_AT
  )

  const pickUpTip = () => {
    sendSessionCommand(Sessions.deckCalCommands.PICK_UP_TIP)
  }

  const jog = (axis: JogAxis, dir: JogDirection, step: JogStep) => {
    sendSessionCommand(Sessions.deckCalCommands.JOG, {
      vector: formatJogVector(axis, dir, step),
    })
  }

  return (
    <>
      <Flex
        marginY={SPACING_2}
        flexDirection={DIRECTION_COLUMN}
        alignItems={ALIGN_FLEX_START}
        position={POSITION_RELATIVE}
        width="100%"
      >
        <h3 className={styles.intro_header}>
          {TIP_PICK_UP_HEADER}
          {tipRackDef
            ? getLabwareDisplayName(tipRackDef).replace('µL', 'uL')
            : null}
        </h3>
        <Box
          padding={SPACING_3}
          border={BORDER_SOLID_LIGHT}
          borderWidth="2px"
          width="100%"
        >
          <Flex
            justifyContent={JUSTIFY_CENTER}
            flexDirection={DIRECTION_COLUMN}
            alignItems={ALIGN_CENTER}
            textAlign={TEXT_ALIGN_CENTER}
          >
            <Text fontSize={FONT_SIZE_BODY_2} paddingX={SPACING_2}>
              {jogUntilAbove}
            </Text>
            <Text
              fontSize={FONT_SIZE_BODY_2}
              marginBottom={SPACING_3}
              paddingX={SPACING_2}
            >
              <Text as="strong">{` ${TIP_WELL_NAME} `}</Text>
              {`${POSITION} ${AND}`}
              <Text as="strong">{` ${FLUSH} `}</Text>
              {WITH_TOP_OF_TIP}
            </Text>
            <div className={styles.step_check_video_wrapper}>
              <video
                key={demoAsset}
                className={styles.step_check_video}
                autoPlay={true}
                loop={true}
                controls={false}
              >
                <source src={demoAsset} />
              </video>
            </div>
          </Flex>
        </Box>
        <div>
          <JogControls jog={jog} />
        </div>
        <Flex width="100%">
          <PrimaryButton onClick={pickUpTip} className={styles.command_button}>
            {TIP_PICK_UP_BUTTON_TEXT}
          </PrimaryButton>
        </Flex>
      </Flex>
    </>
  )
}
