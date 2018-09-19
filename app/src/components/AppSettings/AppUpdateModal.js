// @flow
// AlertModal for updating to newest app version
import * as React from 'react'

import {Icon, AlertModal, type ButtonProps} from '@opentrons/components'
import {Portal} from '../portal'
import {BottomButtonBar} from '../modals'
import ReleaseNotes from './ReleaseNotes'
import styles from './styles.css'

import type {ShellUpdateState} from '../../shell'

type Props = {
  update: ShellUpdateState,
  availableVersion: ?string,
  downloadUpdate: () => mixed,
  applyUpdate: () => mixed,
  closeModal: () => mixed,
}

// TODO(mc, 2018-03-19): prop or component for text-height icons
const Spinner = () => <Icon name="ot-spinner" height="1em" spin />

export default function AppUpdateModal (props: Props) {
  const {
    closeModal,
    availableVersion,
    update: {downloading, info},
  } = props
  const buttonProps = mapPropsToButtonProps(props)
  const closeButtonChildren = downloading ? 'close' : 'not now'

  return (
    <Portal>
      <AlertModal
        heading={`Version ${availableVersion || ''} Available`}
        onCloseClick={closeModal}
        className={styles.update_modal}
        contentsClassName={styles.update_modal_contents}
        alertOverlay
      >
        <ReleaseNotes source={info && info.releaseNotes} />
        <BottomButtonBar
          buttons={[
            {onClick: closeModal, children: closeButtonChildren},
            buttonProps,
          ]}
        />
      </AlertModal>
    </Portal>
  )
}

const DOWNLOAD = 'download'
const DOWNLOAD_IN_PROGRESS = 'downloading'
const RESTART = 'restart app'

function mapPropsToButtonProps (props: Props): ButtonProps {
  const {downloaded, checking, downloading} = props.update
  const disabled = checking || downloading
  const onClick = downloaded ? props.applyUpdate : props.downloadUpdate

  let buttonProps: ButtonProps = {onClick, disabled}

  if (downloaded) {
    buttonProps.children = RESTART
  } else if (downloading) {
    buttonProps.children = (
      <React.Fragment>
        {`${DOWNLOAD_IN_PROGRESS} `}
        <Spinner />
      </React.Fragment>
    )
  } else {
    buttonProps.children = DOWNLOAD
  }

  return buttonProps
}
