import * as React from 'react'

import { AlertModal } from '@opentrons/components'
import { Portal } from '../../../App/portal'

export interface ConfirmUploadModalProps {
  confirm: () => unknown
  cancel: () => unknown
}

export function ConfirmUploadModal(
  props: ConfirmUploadModalProps
): JSX.Element {
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
