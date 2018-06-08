// @flow
import * as React from 'react'
import {Link} from 'react-router-dom'
import {AlertModal} from '@opentrons/components'
import type {Error} from '../../types'

type Props = {
  closeUrl: string,
  error: Error
}

const HEADING = 'Unexpected Error'
export default function ErrorModal (props: Props) {
  const {error, closeUrl} = props

  return (
    <AlertModal
      heading={HEADING}
      buttons={[
        {children: 'close', Component: Link, to: closeUrl}
      ]}
      alertOverlay
    >
      <p><em>{error.message}</em></p>
      <p>An unexpected error has cleared your deck calibration progress, please try again.</p>
      <p>If you keep getting this message, try restarting your robot. If this does not resolve the issue please contact Opentrons Support.</p>
    </AlertModal>
  )
}
