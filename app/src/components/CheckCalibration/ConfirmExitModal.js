// @flow
import * as React from 'react'

import { AlertModal } from '@opentrons/components'

export type ConfirmExitModalProps = {|
  back: () => mixed,
  exit: () => mixed,
|}

const HEADING = 'Are you sure you want to exit?'
const GO_BACK = 'go back'
const EXIT = 'confirm exit'
const WARNING =
  'Doing so will take you to the summary page and prompt you to drop the tip.'

export function ConfirmExitModal(props: ConfirmExitModalProps): React.Node {
  const { back, exit } = props

  return (
    <AlertModal
      heading={HEADING}
      buttons={[
        { title: 'go back', children: GO_BACK, onClick: back },
        { title: 'confirm exit', children: EXIT, onClick: exit },
      ]}
      alertOverlay
    >
      {WARNING}
    </AlertModal>
  )
}
