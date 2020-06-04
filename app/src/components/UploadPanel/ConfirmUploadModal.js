// @flow
import * as React from 'react'

import { AlertModal } from '@opentrons/components'
import { Portal } from '../portal'

export type ConfirmUploadModalProps = {|
  confirm: () => mixed,
  cancel: () => mixed,
|}

export function ConfirmUploadModal(props: ConfirmUploadModalProps): React.Node {
  return (
    <Portal>
      <AlertModal
        heading={'Are you sure you want to open a new protocol?'}
        buttons={[
          { children: 'cancel', onClick: props.cancel },
          { children: 'continue', onClick: props.confirm },
        ]}
        alertOverlay
      >
        Doing so will close your current protocol and clear any unsaved
        calibration progress.
      </AlertModal>
    </Portal>
  )
}
