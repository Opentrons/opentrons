// @flow
import type { ButtonProps } from '@opentrons/components'
import * as React from 'react'

import type { ShellUpdateState } from '../../../shell/types'
import { ScrollableAlertModal } from '../../modals'
import { Portal } from '../../portal'
import { ReleaseNotes } from '../../ReleaseNotes'
import { UpdateAppMessage } from './UpdateAppMessage'

export type UpdateAppModalProps = {|
  update: ShellUpdateState,
  availableVersion: ?string,
  downloadUpdate: () => mixed,
  applyUpdate: () => mixed,
  closeModal: () => mixed,
|}

type UpdateAppModalState = {|
  showReleaseNotes: boolean,
|}

export class UpdateAppModal extends React.Component<
  UpdateAppModalProps,
  UpdateAppModalState
> {
  constructor(props: UpdateAppModalProps) {
    super(props)
    this.state = { showReleaseNotes: false }
  }

  setShowReleaseNotes: () => void = () => {
    this.setState({ showReleaseNotes: true })
  }

  render(): React.Node {
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
