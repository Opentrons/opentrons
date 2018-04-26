// @flow
// wifi connect response (or error) alert modal
import * as React from 'react'

import type {
  WifiConfigureResponse,
  ApiRequestError
} from '../../http-api-client'

import {AlertModal} from '@opentrons/components'

type Props = {
  onClose: () => mixed,
  error: ?ApiRequestError,
  response: ?WifiConfigureResponse
}

const SUCCESS_TITLE = 'Successfully connected to '
const FAILURE_TITLE = 'Could not join network'

const SUCCESS_MESSAGE = 'Your robot has successfully connected to WiFi and should appear in the robot list shortly. If not, try refreshing the list manually or rebooting the robot.'
const FAILURE_MESSAGE = 'Please double check your network credentials. If this problem persists, try rebooting the robot or contacting our support team.'

export default function WifiConnectModal (props: Props) {
  const {onClose} = props
  let title
  let message

  if (props.response) {
    title = `${SUCCESS_TITLE} ${props.response.ssid}`
    message = SUCCESS_MESSAGE
  } else {
    title = FAILURE_TITLE
    message = FAILURE_MESSAGE
  }

  return (
    <AlertModal
      heading={title}
      onCloseClick={onClose}
      buttons={[
        {onClick: onClose, children: 'close'}
      ]}
    >
      {message}
    </AlertModal>
  )
}
