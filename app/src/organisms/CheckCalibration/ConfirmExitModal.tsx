import * as React from 'react'

import { AlertModal } from '@opentrons/components'

export interface ConfirmExitModalProps {
  back: () => unknown
  exit: () => unknown
}

const HEADING = 'Are you sure you want to exit?'
const GO_BACK = 'go back'
const EXIT = 'continue'
const WARNING =
  'Doing so will take you to the summary page and prompt you to drop the tip.'

export function ConfirmExitModal(props: ConfirmExitModalProps): JSX.Element {
  const { back, exit } = props

  return (
    <AlertModal
      heading={HEADING}
      buttons={[
        { children: GO_BACK, onClick: back },
        { children: EXIT, onClick: exit },
      ]}
      alertOverlay
    >
      {WARNING}
    </AlertModal>
  )
}
