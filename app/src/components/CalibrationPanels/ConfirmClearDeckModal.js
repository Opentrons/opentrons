// @flow
import * as React from 'react'

import { AlertModal } from '@opentrons/components'

export type ConfirmClearDeckModalProps = {|
  cancel: () => mixed,
  confirm: () => mixed,
|}

const HEADING = 'Clear the deck'
const CANCEL = 'cancel'
const CONTINUE = 'continue'
const WARNING =
  'Before continuing to calibrate the deck, please remove all labware and modules from the deck.'

export function ConfirmClearDeckModal(
  props: ConfirmClearDeckModalProps
): React.Node {
  const { cancel, confirm } = props

  return (
    <AlertModal
      heading={HEADING}
      buttons={[
        { children: CANCEL, onClick: cancel },
        { children: CONTINUE, onClick: confirm },
      ]}
      alertOverlay
      iconName={null}
    >
      {WARNING}
    </AlertModal>
  )
}
