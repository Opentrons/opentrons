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
  JUSTIFY_SPACE_BETWEEN,
} from '@opentrons/components'
import styles from './styles.css'
import type { CalibrateDeckChildProps } from './types'
import * as Sessions from '../../sessions'

const COMPLETE_HEADER = 'Deck calibration complete'
const RETURN_TIP = 'Return tip to tip rack and exit'

export function CompleteConfirmation(
  props: CalibrateDeckChildProps
): React.Node {
  const exitSession = () => {
    props.sendSessionCommand(Sessions.deckCalCommands.EXIT)
    // TODO: IMMEDIATELY use actualy epic for managing chained dependent commands
    setTimeout(() => {
      props.deleteSession()
    }, 300)
  }
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      padding={SPACING_3}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      alignItems={ALIGN_FLEX_START}
      width="100%"
      flex={1}
    >
      <Flex alignItems={ALIGN_CENTER} marginTop={SPACING_3}>
        <Icon name="check-circle" className={styles.success_status_icon} />
        <h3>{COMPLETE_HEADER}</h3>
      </Flex>

      <PrimaryButton marginY={SPACING_3} onClick={exitSession}>
        {RETURN_TIP}
      </PrimaryButton>
    </Flex>
  )
}
