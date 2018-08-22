// @flow
import * as React from 'react'
import {Link} from 'react-router-dom'
import {AlertModal} from '@opentrons/components'

type Props = {
  parentUrl: string,
}

const HEADING = 'No pipette attached'
export default function NoPipetteModal (props: Props) {
  return (
    <AlertModal
      heading={HEADING}
      buttons={[
        {children: 'close', Component: Link, to: props.parentUrl}
      ]}
      alertOverlay
    >
      <p>Please attach a pipette before attempting to calibrate robot.</p>
    </AlertModal>
  )
}
