// @flow
import * as React from 'react'

import { Portal } from '../../portal'
import { ScrollableAlertModal } from '../../modals'
import UpdateAppMessage from './UpdateAppMessage'
import ReleaseNotes from '../../ReleaseNotes'

import type { ShellUpdateState } from '../../../shell/types'
import type { ButtonProps } from '@opentrons/components'

type Props = {
  update: ShellUpdateState,
  availableVersion: ?string,
  downloadUpdate: () => mixed,
  applyUpdate: () => mixed,
  closeModal: () => mixed,
}

type UpdateAppState = {
  showReleaseNotes: boolean,
}

export default class UpdateAppModal extends React.Component<
  Props,
  UpdateAppState
> {
  constructor(props: Props) {
    super(props)
    this.state = { showReleaseNotes: false }
  }

  setShowReleaseNotes = () => {
    this.setState({ showReleaseNotes: true })
  }

  render() {
    const {
      downloadUpdate,
      closeModal,
      availableVersion,
      update: { info },
    } = this.props
    const { showReleaseNotes } = this.state

    let children: ?React.Node
    let button: ?ButtonProps

    if (showReleaseNotes) {
      button = {
        children: 'download',
        onClick: downloadUpdate,
      }
      children = <ReleaseNotes source={info && info.releaseNotes} />
    } else {
      button = {
        children: 'View App Update',
        onClick: this.setShowReleaseNotes,
      }
      children = <UpdateAppMessage />
    }

    return (
      <Portal>
        <ScrollableAlertModal
          heading={`App Version ${availableVersion || ''} Available`}
          buttons={[{ onClick: closeModal, children: 'not now' }, button]}
        >
          {children}
        </ScrollableAlertModal>
      </Portal>
    )
  }
}
