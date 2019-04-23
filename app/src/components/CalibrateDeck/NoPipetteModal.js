// @flow
import * as React from 'react'
import { AlertModal } from '@opentrons/components'

type Props = {|
  close: () => mixed,
|}

const HEADING = 'No pipette attached'
export default function NoPipetteModal(props: Props) {
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
