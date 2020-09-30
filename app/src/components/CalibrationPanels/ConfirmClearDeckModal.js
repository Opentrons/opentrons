// @flow
import * as React from 'react'

import { AlertModal } from '@opentrons/components'

export type ConfirmClearDeckModalProps = {|
  cancel: () => mixed,
  confirm: () => mixed,
  continuingTo: string,
|}

const HEADING = 'Clear the deck'
const CANCEL = 'cancel'
const CONTINUE = 'continue'
const BEFORE = 'Before continuing'
const WARNING = ', please remove all labware and modules from the deck.'

export function ConfirmClearDeckModal(
  props: ConfirmClearDeckModalProps
): React.Node {
  const { cancel, confirm, continuingTo } = props

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
      {`${BEFORE} ${continuingTo}${WARNING}`}
    </AlertModal>
  )
}
