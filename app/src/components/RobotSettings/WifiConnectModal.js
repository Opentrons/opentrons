// @flow
// wifi connect response (or error) alert modal
import * as React from 'react'

import type {
  WifiConfigureResponse,
  ApiRequestError,
} from '../../http-api-client'

import {AlertModal} from '@opentrons/components'
import {Portal} from '../portal'
import {ErrorModal} from '../modals'

type Props = {
  close: () => mixed,
  error: ?ApiRequestError,
  response: ?WifiConfigureResponse,
}

const SUCCESS_TITLE = 'Successfully connected to '
const FAILURE_TITLE = 'Could not join network'

const SUCCESS_MESSAGE = 'Your robot has successfully connected to WiFi and should appear in the robot list shortly. If not, try refreshing the list manually or rebooting the robot.'
const FAILURE_MESSAGE = 'The robot was unable to connect to the selected WiFi network. Please double check your network credentials.'

export default function WifiConnectModal (props: Props) {
  const {response, error, close} = props

  if (error || !response) {
    const modalError = error || {
      name: 'NoResponseError',
      message: 'No response received',
    }

    return (
      <ErrorModal
        heading={FAILURE_TITLE}
        description={FAILURE_MESSAGE}
        close={close}
        error={modalError}
      />
    )
  }

  return (
    <Portal>
      <AlertModal
        iconName='wifi'
        heading={`${SUCCESS_TITLE} ${response.ssid}`}
        onCloseClick={close}
        buttons={[
          {onClick: close, children: 'close'},
        ]}
        alertOverlay
      >
        {SUCCESS_MESSAGE}
      </AlertModal>
    </Portal>
  )
}
