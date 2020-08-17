// @flow
import * as React from 'react'
import {
  Flex,
  Icon,
  PrimaryButton,
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  DIRECTION_COLUMN,
  SPACING_3,
} from '@opentrons/components'
import styles from './styles.css'
import type { CalibrateDeckChildProps } from './types'
import * as Sessions from '../../sessions'

const COMPLETE_HEADER = 'Deck calibration complete'
const RETURN_TIP = 'Return tip to tip rack'

export function CompleteConfirmation(
  props: CalibrateDeckChildProps
): React.Node {
  const exitSession = () => {
    props.sendSessionCommand(Sessions.deckCalCommands.EXIT)
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

        <PrimaryButton marginY={SPACING_3} onClick={exitSession}>
          {RETURN_TIP}
        </PrimaryButton>
      </Flex>
    </>
  )
}
