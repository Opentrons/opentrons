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
} from '@opentrons/components'
import styles from './styles.css'
import type { CalibrateTipLengthChildProps } from './types'
import * as Sessions from '../../sessions'

const COMPLETE_HEADER = 'Tip length calibration complete'
const COMPLETE_BODY = 'Remove Calibration Block from the deck.'
const RETURN_TIP = 'Return tip to tip rack'

export function CompleteConfirmation(
  props: CalibrateTipLengthChildProps
): React.Node {
  const exitSession = () => {
    props.sendSessionCommand(Sessions.tipCalCommands.EXIT)
    props.deleteSession()
  }
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
          {props.hasBlock ? COMPLETE_BODY : null}
        </Text>

        {/* TODO: add block removal demo asset */}

        <PrimaryButton marginY={SPACING_3} onClick={exitSession}>
          {RETURN_TIP}
        </PrimaryButton>
      </Flex>
    </>
  )
}
