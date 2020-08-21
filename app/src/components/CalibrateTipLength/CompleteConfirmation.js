// @flow
import * as React from 'react'
import {
  Flex,
  Icon,
  PrimaryButton,
  Text,
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  DIRECTION_COLUMN,
  SPACING_3,
  SPACING_4,
  JUSTIFY_CENTER,
  ALIGN_STRETCH,
} from '@opentrons/components'
import styles from './styles.css'
import type { CalibrateTipLengthChildProps } from './types'
import * as Sessions from '../../sessions'

import slotOneRemoveBlockAsset from '../../assets/videos/tip-length-cal/Slot_1_Remove_CalBlock_(330x260)REV1.webm'
import slotThreeRemoveBlockAsset from '../../assets/videos/tip-length-cal/Slot_3_Remove_CalBlock_(330x260)REV1.webm'

const COMPLETE_HEADER = 'Tip length calibration complete'
const COMPLETE_BODY = 'Remove Calibration Block from the deck.'
const RETURN_TIP = 'Return tip to tip rack'

const assetBySlot = {
  '1': slotOneRemoveBlockAsset,
  '3': slotThreeRemoveBlockAsset,
}

export function CompleteConfirmation(
  props: CalibrateTipLengthChildProps
): React.Node {
  const exitSession = () => {
    props.sendSessionCommand(Sessions.tipCalCommands.EXIT)
    props.deleteSession()
  }

  const demoAsset = props.calBlock ? assetBySlot[props.calBlock.slot] : null

  return (
    <>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        padding={SPACING_3}
        alignItems={ALIGN_FLEX_START}
        width="100%"
      >
        <Flex alignItems={ALIGN_CENTER}>
          <Icon name="check-circle" className={styles.success_status_icon} />
          <h3>{COMPLETE_HEADER}</h3>
        </Flex>
        <Text marginY={SPACING_4} className={styles.complete_summary}>
          {props.calBlock ? COMPLETE_BODY : null}
        </Text>

        {props.calBlock && (
          <Flex justifyContent={JUSTIFY_CENTER} alignSelf={ALIGN_STRETCH}>
            <video
              key={demoAsset}
              className={styles.step_check_video}
              autoPlay={true}
              loop={true}
              controls={false}
            >
              <source src={demoAsset} />
            </video>
          </Flex>
        )}

        <PrimaryButton marginY={SPACING_3} onClick={exitSession}>
          {RETURN_TIP}
        </PrimaryButton>
      </Flex>
    </>
  )
}
