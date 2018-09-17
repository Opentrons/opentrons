// @flow
// AlertModal for updating to newest app version
import * as React from 'react'

import type {ShellUpdateState} from '../../shell'
import {Icon, AlertModal, type ButtonProps} from '@opentrons/components'
import {Portal} from '../portal'

type Props = {
  update: ShellUpdateState,
  availableVersion: ?string,
  downloadUpdate: () => mixed,
  applyUpdate: () => mixed,
  close: () => mixed,
}

// TODO(mc, 2018-03-19): prop or component for text-height icons
const Spinner = () => (<Icon name='ot-spinner' height='1em' spin />)

export default function AppUpdateModal (props: Props) {
  const {close, availableVersion, update: {error, downloading}} = props
  const {button, message} = mapPropsToButtonPropsAndMessage(props)
  const closeButtonChildren = error || downloading
    ? 'close'
    : 'not now'

  return (
    <Portal>
      <AlertModal
        heading={`App Version ${availableVersion || ''} Available`}
        onCloseClick={close}
        buttons={[
          {onClick: close, children: closeButtonChildren},
          button,
        ]}
        alertOverlay
      >
        {message}
      </AlertModal>
    </Portal>
  )
}

function mapPropsToButtonPropsAndMessage (props: Props) {
  const {error, downloaded, checking, downloading} = props.update

  if (error) {
    return {
      button: null,
      message: 'Something went wrong retrieving the update. Please try restarting the app and trying again. If the problem persists, contact Opentrons support.',
    }
  }

  const disabled = error || checking || downloading
  const onClick = downloaded ? props.applyUpdate : props.downloadUpdate

  let message
  let button: ButtonProps = {onClick, disabled}

  if (downloaded) {
    message = 'Restart the app to finish the update'
    button.children = 'Restart'
  } else if (downloading) {
    message = 'Update is downloading.'
    button.children = (<Spinner />)
  } else {
    message = 'We recommend updating your app to the latest version'
    button.children = 'Download'
  }

  return {message, button}
}
