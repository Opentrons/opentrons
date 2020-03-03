// @flow
import * as React from 'react'
import { AlertModal } from '@opentrons/components'

export type NoPipetteModalProps = {|
  close: () => mixed,
|}

const HEADING = 'No pipette attached'

export function NoPipetteModal(props: NoPipetteModalProps) {
  return (
    <AlertModal
      heading={HEADING}
      buttons={[{ children: 'close', onClick: props.close }]}
      alertOverlay
    >
      <p>Please attach a pipette before attempting to calibrate robot.</p>
    </AlertModal>
  )
}
