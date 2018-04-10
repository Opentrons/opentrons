// @flow
import * as React from 'react'
import {Link} from 'react-router-dom'

import {AlertModal} from '@opentrons/components'

type Props = {
  cancelUrl: string,
  continueUrl: string,
}

const HEADING = 'Are you sure you want to go back?'
const CANCEL_TEXT = 'cancel'
const CONTINUE_TEXT = 'continue'

export default function ChangePipette (props: Props) {
  const {cancelUrl, continueUrl} = props

  return (
    <AlertModal
      heading={HEADING}
      buttons={[
        {children: CANCEL_TEXT, Component: Link, to: cancelUrl},
        {children: CONTINUE_TEXT, Component: Link, to: continueUrl}
      ]}
    >
      <p>Doing so will exit pipette setup and home your robot.</p>
    </AlertModal>
  )
}
