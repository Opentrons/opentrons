// @flow
// wifi connect response (or error) alert modal
import * as React from 'react'

import type {
  WifiConfigureRequest,
  WifiConfigureResponse,
  ApiRequestError,
} from '../../../../http-api-client'

import { AlertModal } from '@opentrons/components'
import { ErrorModal } from '../../../modals'

type WifiConnectModalProps = {|
  close: () => mixed,
  request: WifiConfigureRequest,
  response: ?WifiConfigureResponse,
  error: ?ApiRequestError,
|}

const SUCCESS_TITLE = 'Successfully connected to Wi-Fi'
const FAILURE_TITLE = 'Unable to connect to Wi-Fi'

const success = ssid =>
  `Your robot has successfully connected to Wi-Fi network ${ssid}.`

const failure = ssid =>
  `Your robot was unable to connect to ${ssid}. Please double-check your network credentials.`

const ERROR_MESSAGE_RE = /Error: (.*)$/

export function WifiConnectModal(props: WifiConnectModalProps) {
  const { request, response, error, close } = props
  const { ssid } = request

  if (error || !response) {
    let errorMessage = 'An unknown error occurred'

    if (error && error.message) {
      // TODO(mc, 2018-10-18): improve API message response from NMCLI
      const messageMatch = error.message.match(ERROR_MESSAGE_RE)
      errorMessage = messageMatch ? messageMatch[1] : error.message
    }

    const modalError = {
      name: (error && error.name) || 'UnknownError',
      message: errorMessage,
    }

    return (
      <ErrorModal
        heading={FAILURE_TITLE}
        description={failure(ssid)}
        close={close}
        error={modalError}
      />
    )
  }

  return (
    <AlertModal
      iconName="wifi"
      heading={SUCCESS_TITLE}
      onCloseClick={close}
      buttons={[{ onClick: close, children: 'close' }]}
      alertOverlay
    >
      {success(ssid)}
    </AlertModal>
  )
}
