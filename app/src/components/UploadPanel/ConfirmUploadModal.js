// @flow
import React from 'react'

import {AlertModal} from '@opentrons/components'
import {Portal} from '../portal'

type Props = {
  confirm: () => mixed,
  cancel: () => mixed,
}

export default function ConfirmUploadModal (props: Props) {
  return (
    <Portal>
      <AlertModal
        heading={'Are you sure you want to open a new protocol?'}
        buttons={[
          {children: 'cancel', onClick: props.cancel},
          {children: 'continue', onClick: props.confirm},
        ]}
        alertOverlay
      >
        Doing so will close your current protocol and clear any unsaved calibration progress.
      </AlertModal>
    </Portal>
  )
}
