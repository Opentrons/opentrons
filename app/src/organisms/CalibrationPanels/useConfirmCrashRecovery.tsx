import * as React from 'react'
import { css } from 'styled-components'

import { getLabwareDisplayName } from '@opentrons/shared-data'

import * as Sessions from '../../redux/sessions'
import {
  Flex,
  Text,
  JUSTIFY_CENTER,
  FONT_SIZE_BODY_1,
  C_BLUE,
} from '@opentrons/components'

import { ConfirmCrashRecoveryModal } from './ConfirmCrashRecoveryModal'

import type { CalibrationPanelProps } from './types'

const CONDITION = 'Jog too far or bend a tip?'
const START_OVER = 'Start over'

export interface Props extends CalibrationPanelProps {
  requiresNewTip: boolean
}

export function useConfirmCrashRecovery(
  props: Props
): [message: React.ReactNode, modal: React.ReactNode] {
  const { sendCommands, tipRack, requiresNewTip } = props
  const [showModal, setShowModal] = React.useState(false)

  const doStartOver = (): void => {
    sendCommands({ command: Sessions.sharedCalCommands.INVALIDATE_LAST_ACTION })
  }
  return [
    <Flex key="crash-recovery-link" justifyContent={JUSTIFY_CENTER}>
      <Text fontSize={FONT_SIZE_BODY_1}>{CONDITION}</Text>
      &nbsp;
      <Text
        fontSize={FONT_SIZE_BODY_1}
        color={C_BLUE}
        as="a"
        onClick={() => setShowModal(true)}
        css={css`
          cursor: pointer;
        `}
      >
        {START_OVER}
      </Text>
    </Flex>,
    showModal ? (
      <ConfirmCrashRecoveryModal
        key="crash-recovery-modal"
        confirm={doStartOver}
        back={() => {
          setShowModal(false)
        }}
        tipRackDisplayName={getLabwareDisplayName(tipRack.definition)}
        tipRackSlot={tipRack.slot}
        requiresNewTip={requiresNewTip}
      />
    ) : null,
  ]
}
