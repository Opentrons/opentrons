// @flow
import * as React from 'react'
import {Link} from 'react-router-dom'
import {AlertModal} from '@opentrons/components'
import {type ApiRequestError} from '../../http-api-client'

type Props = {
  closeUrl: string,
  error: ApiRequestError
}

const HEADING = 'Error'
export default function ErrorModal (props: Props) {
  const {error, closeUrl} = props
  return (
    <AlertModal
      heading={HEADING}
      buttons={[
        {children: 'close', Component: Link, to: closeUrl}
      ]}
    >
      <p>Something went wrong</p>
      {error.message}
    </AlertModal>
  )
}
