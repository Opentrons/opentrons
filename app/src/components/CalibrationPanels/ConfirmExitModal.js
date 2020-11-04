// @flow
import * as React from 'react'

import { AlertModal, Text } from '@opentrons/components'
import * as Sessions from '../../sessions'
import type { SessionType } from '../../sessions/types'

export type ConfirmExitModalProps = {|
  back: () => mixed,
  exit: () => mixed,
  sessionType: SessionType,
|}

const HEADING = 'Are you sure?'
const GO_BACK = 'no, go back'
const EXIT = 'yes, exit now'
const ARE_YOU_SURE = 'Are you sure you want to exit'
const NOW = 'now?'

const sessionNameBySessionType: { [SessionType]: string } = {
  [Sessions.SESSION_TYPE_DECK_CALIBRATION]: 'Deck Calibration',
  [Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION]:
    'Pipette Offset Calibration',
  [Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION]: 'Tip Length Calibration',
  [Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK]: 'Calibration Health Check',
}

const warningBySessionType: { [SessionType]: string } = {
  [Sessions.SESSION_TYPE_DECK_CALIBRATION]:
    'Doing so will return the pipette tip and exit deck calibration.',
  [Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION]:
    'Doing so will return the pipette tip and exit pipette offset calibration.',
  [Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION]:
    'Doing so will return the pipette tip and exit tip length calibration.',
  [Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK]:
    'If you exit now, you will not get any data about your calibration health.',
}

export function ConfirmExitModal(props: ConfirmExitModalProps): React.Node {
  const { back, exit, sessionType } = props

  return (
    <AlertModal
      heading={HEADING}
      buttons={[
        { children: GO_BACK, onClick: back },
        { children: EXIT, onClick: exit },
      ]}
      alertOverlay
      iconName="alert"
    >
      <Text>
        {ARE_YOU_SURE} {sessionNameBySessionType[sessionType] ?? null} {NOW}
      </Text>
      {warningBySessionType[sessionType] ?? null}
    </AlertModal>
  )
}
