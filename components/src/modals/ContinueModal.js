// @flow
import * as React from 'react'

import AlertModal from './AlertModal'

type AlertModalProps = React.ElementProps<typeof AlertModal>
type ContinueModalProps = {|
  ...$Diff<$Exact<AlertModalProps>, { buttons: any }>,
  onCancelClick: () => mixed,
  onContinueClick: () => mixed,
|}

const CANCEL = 'Cancel'
const CONTINUE = 'Continue'

/**
 * AlertModal variant to prompt user to "Cancel" or "Continue" a given action
 */
export default function ContinueModal(props: ContinueModalProps) {
  const { onCancelClick, onContinueClick, ...passThruProps } = props
  const buttons = [
    { title: CANCEL, children: CANCEL, onClick: onCancelClick },
    { title: CONTINUE, children: CONTINUE, onClick: onContinueClick },
  ]

  return (
    <AlertModal
      restrictOuterScroll={false}
      onCloseClick={onCancelClick}
      {...passThruProps}
      buttons={buttons}
    />
  )
}
