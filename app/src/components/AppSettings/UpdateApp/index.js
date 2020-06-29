// @flow
import { SpinnerModal } from '@opentrons/components'
import * as React from 'react'

import type { ShellUpdateState } from '../../../shell/types'
import { RestartAppModal } from './RestartAppModal'
import { UpdateAppModal } from './UpdateAppModal'

export type UpdateAppProps = {|
  update: ShellUpdateState,
  availableVersion: ?string,
  downloadUpdate: () => mixed,
  applyUpdate: () => mixed,
  closeModal: () => mixed,
|}

export function UpdateApp(props: UpdateAppProps): React.Node {
  const {
    update,
    availableVersion,
    downloadUpdate,
    applyUpdate,
    closeModal,
  } = props
  const { downloaded, downloading } = update

  if (downloaded) {
    return (
      <RestartAppModal {...{ availableVersion, applyUpdate, closeModal }} />
    )
  } else if (downloading) {
    return <SpinnerModal message="Download in progress" alertOverlay />
  } else {
    return (
      <UpdateAppModal
        {...{
          update,
          availableVersion,
          downloadUpdate,
          applyUpdate,
          closeModal,
        }}
      />
    )
  }
}
