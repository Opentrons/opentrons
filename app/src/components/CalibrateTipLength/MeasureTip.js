// @flow
import * as React from 'react'
import {
  Box,
  Flex,
  PrimaryButton,
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  BORDER_SOLID_LIGHT,
  DIRECTION_COLUMN,
  JUSTIFY_CENTER,
  POSITION_RELATIVE,
  SPACING_2,
  SPACING_3,
  TEXT_ALIGN_CENTER,
} from '@opentrons/components'

import * as Sessions from '../../sessions'
import { JogControls } from '../JogControls'
import type { JogAxis, JogDirection, JogStep } from '../../http-api-client'
import styles from './styles.css'
import type { CalibrateTipLengthChildProps } from './types'
<<<<<<< HEAD
import { formatJogVector } from './utils'
=======
import leftMultiBlockTipAsset from './videos/Left_Multi_CalBlock_Tip_REV1.webm'
import leftMultiTrashTipAsset from './videos/Left_Multi_Trash_Tip_REV1.webm'
>>>>>>> refactor(app): tip length calibration: jog + complete screens

const assetMap = {
  block: {
    left: {
      multi: leftMultiBlockTipAsset,
      single: leftMultiBlockTipAsset, // TODO: get asset for single pipettes
    },
    right: {
      multi: leftMultiBlockTipAsset,
      single: leftMultiBlockTipAsset, // TODO: get asset for single pipettes
    },
  },
  trash: {
    left: {
      multi: leftMultiTrashTipAsset,
      single: leftMultiTrashTipAsset, // TODO: get asset for single pipettes
    },
    right: {
      multi: leftMultiTrashTipAsset,
      single: leftMultiTrashTipAsset, // TODO: get asset for single pipettes
    },
  },
}

const HEADER = 'Save the tip length'
const JOG_UNTIL = 'Jog the robot until tip is'
const JUST_BARELY = 'just barely'
const TOUCHING = 'touching the deck in'
const THE = 'the'
const BLOCK = 'block in'
const FLAT_SURFACE = 'flat surface'
const OF_THE_TRASH_BIN = 'of the trash bin'
const SAVE_NOZZLE_Z_AXIS = 'Save the tip length'

export function MeasureTip(props: CalibrateTipLengthChildProps): React.Node {
<<<<<<< HEAD
  const { sendSessionCommand } = props
=======
  const { mount, hasBlock } = props
>>>>>>> refactor(app): tip length calibration: jog + complete screens
  // TODO: get real isMulti and mount and slotName from the session
  const isMulti = false
  const slotName = 'slot 3'

  const demoAsset = React.useMemo(
    () =>
      mount &&
      assetMap[hasBlock ? 'block' : 'trash'][mount][
        isMulti ? 'multi' : 'single'
      ],
    [mount, isMulti, hasBlock]
  )

  const jog = (axis: JogAxis, dir: JogDirection, step: JogStep) => {
    sendSessionCommand(Sessions.tipCalCommands.JOG, {
      vector: formatJogVector(axis, dir, step),
    })
  }

  const proceed = () => {
    sendSessionCommand(Sessions.tipCalCommands.SAVE_OFFSET)
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
        <h3 className={styles.intro_header}>{HEADER}</h3>
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
            <p className={styles.tip_pick_up_demo_body}>
              {JOG_UNTIL}
              <b>&nbsp;{JUST_BARELY}&nbsp;</b>
              {TOUCHING}
              &nbsp;
              {THE}
              &nbsp;
              {hasBlock ? BLOCK : <b>{FLAT_SURFACE}</b>}
              &nbsp;
              {hasBlock ? <b>{`${slotName}`}</b> : OF_THE_TRASH_BIN}
              &#46;
            </p>
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
          <JogControls jog={jog} stepSizes={[0.1, 1]} axes={['z']} />
        </div>
        <Flex width="100%">
          <PrimaryButton onClick={proceed} className={styles.command_button}>
            {SAVE_NOZZLE_Z_AXIS}
          </PrimaryButton>
        </Flex>
      </Flex>
    </>
  )
}
