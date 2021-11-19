import { AlertModal } from '@opentrons/components'
import * as React from 'react'

interface Props {
  title: string
  confirmText: string
  denyText: string
  onConfirm: () => void
  onDeny: () => void
}

export const ConfirmPickUpTipModal = (props: Props): JSX.Element => {
  return (
    <AlertModal
      heading={props.title}
      buttons={[
        { children: props.denyText, onClick: props.onDeny },
        { children: props.confirmText, onClick: props.onConfirm },
      ]}
      alertOverlay
    >
      {null}
    </AlertModal>
  )
}
