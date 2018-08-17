// @flow
// AlertModal for updating to newest app version
import * as React from 'react'

import type {ShellUpdate} from '../../shell'
import {Icon, AlertModal, type ButtonProps} from '@opentrons/components'
import {Portal} from '../portal'

type Props = {
  update: ShellUpdate,
  downloadUpdate: () => mixed,
  quitAndInstall: () => mixed,
  close: () => mixed
}

// TODO(mc, 2018-03-19): prop or component for text-height icons
const Spinner = () => (<Icon name='ot-spinner' height='1em' spin />)

export default function AppUpdateModal (props: Props) {
  const {close, update: {error, downloadInProgress}} = props
  const {button, message} = mapPropsToButtonPropsAndMessage(props)
  const closeButtonChildren = error || downloadInProgress
    ? 'close'
    : 'not now'

  return (
    <Portal>
      <AlertModal
        heading={`App Version ${props.update.available || ''} Available`}
        onCloseClick={close}
        buttons={[
          {onClick: close, children: closeButtonChildren},
          button
        ]}
        alertOverlay
      >
        {message}
      </AlertModal>
    </Portal>
  )
}

function mapPropsToButtonPropsAndMessage (props: Props) {
  const {error, downloaded, checkInProgress, downloadInProgress} = props.update

  if (error) {
    return {
      button: null,
      message: 'Something went wrong retrieving the update. Please try restarting the app and trying again. If the problem persists, contact Opentrons support.'
    }
  }

  const disabled = error || checkInProgress || downloadInProgress
  const onClick = downloaded ? props.quitAndInstall : props.downloadUpdate

  let message
  let button: ButtonProps = {onClick, disabled}

  if (downloaded) {
    message = 'Restart the app to finish the update'
    button.children = 'Restart'
  } else if (downloadInProgress) {
    message = 'Update is downloading.'
    button.children = (<Spinner />)
  } else {
    message = 'We recommend updating your app to the latest version'
    button.children = 'Download'
  }

  return {message, button}
}
