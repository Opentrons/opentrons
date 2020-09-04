// @flow
import * as React from 'react'

import { AlertModal } from '@opentrons/components'
import * as Sessions from '../../sessions'
import type { SessionType } from '../../sessions/types'

export type ConfirmExitModalProps = {|
  back: () => mixed,
  exit: () => mixed,
  sessionType: SessionType,
|}

const HEADING = 'Are you sure you want to exit?'
const GO_BACK = 'go back'
const EXIT = 'continue'

const warningBySessionType: { [SessionType]: string } = {
  [Sessions.SESSION_TYPE_DECK_CALIBRATION]:
    'Doing so will return the pipette tip and exit deck calibration.',
  [Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION]:
    'Doing so will return the pipette tip and exit pipette offset calibration.',
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
      iconName={null}
    >
      {warningBySessionType[sessionType] ?? null}
    </AlertModal>
  )
}
