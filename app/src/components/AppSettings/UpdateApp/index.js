// @flow
import * as React from 'react'

import { SpinnerModal } from '@opentrons/components'
import UpdateAppModal from './UpdateAppModal'
import RestartAppModal from './RestartAppModal'

import type { ShellUpdateState } from '../../../shell/types'

type Props = {
  update: ShellUpdateState,
  availableVersion: ?string,
  checkUpdate: () => mixed,
  downloadUpdate: () => mixed,
  applyUpdate: () => mixed,
  closeModal: () => mixed,
}
export default function UpdateApp(props: Props) {
  const { downloaded, downloading } = props.update

  if (downloaded) {
    return <RestartAppModal {...props} />
  } else if (downloading) {
    return <SpinnerModal message="Download in progress" alertOverlay />
  } else {
    return <UpdateAppModal {...props} />
  }
}
