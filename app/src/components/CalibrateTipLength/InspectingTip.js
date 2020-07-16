// @flow
import * as React from 'react'
import {
  Flex,
  PrimaryButton,
  Text,
  ALIGN_FLEX_START,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  JUSTIFY_CENTER,
  POSITION_RELATIVE,
  SPACING_2,
  SPACING_3,
} from '@opentrons/components'

import { getLabwareDisplayName } from '@opentrons/shared-data'
import { getLatestLabwareDef } from '../../getLabware'
import type { CalibrateTipLengthChildProps } from './types'
import styles from './styles.css'

const TIP_PICK_UP_HEADER = 'Position pipette over '

const CONFIRM_TIP_BODY = 'Did pipette pick up tips successfully?'
const CONFIRM_TIP_YES_BUTTON_TEXT = 'Yes, move to measure tip length'
const CONFIRM_TIP_NO_BUTTON_TEXT = 'No, try again'

export function InspectingTip(props: CalibrateTipLengthChildProps): React.Node {
  const { mount, session } = props
  const tiprackID =
    session.details.instruments[mount.toLowerCase()]['tiprack_id']
  const tiprack = session.details.labware.find(l => l.id === tiprackID)

  const tiprackDef = React.useMemo(
    () => getLatestLabwareDef(tiprack?.loadName),
    [tiprack]
  )

  const invalidateTip = () => {
    console.log('TODO: wire up command')
    // props.sendSessionCommand('invalidateTip')
  }
  const confirmTip = () => {
    console.log('TODO: wire up command')
    // props.sendSessionCommand('confirmTip')
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
          {tiprackDef
            ? getLabwareDisplayName(tiprackDef).replace('µL', 'uL')
            : null}
        </h3>
        <Flex
          width="100%"
          flexDirection={DIRECTION_COLUMN}
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_CENTER}
          marginY={SPACING_3}
        >
          <Text marginBottom={SPACING_3}>{CONFIRM_TIP_BODY}</Text>
          <PrimaryButton
            className={styles.pick_up_tip_confirmation_button}
            onClick={invalidateTip}
          >
            {CONFIRM_TIP_NO_BUTTON_TEXT}
          </PrimaryButton>
          <PrimaryButton
            className={styles.pick_up_tip_confirmation_button}
            onClick={confirmTip}
          >
            {CONFIRM_TIP_YES_BUTTON_TEXT}
          </PrimaryButton>
        </Flex>
      </Flex>
    </>
  )
}
