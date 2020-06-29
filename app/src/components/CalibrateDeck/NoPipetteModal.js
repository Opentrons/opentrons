// @flow
import { AlertModal } from '@opentrons/components'
import * as React from 'react'

export type NoPipetteModalProps = {|
  close: () => mixed,
|}

const HEADING = 'No pipette attached'

export function NoPipetteModal(props: NoPipetteModalProps): React.Node {
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
