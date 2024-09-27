import { AlertModal } from './AlertModal'

import type { AlertModalProps } from './AlertModal'

export interface ContinueModalProps extends Omit<AlertModalProps, 'buttons'> {
  onCancelClick: () => unknown
  onContinueClick: () => unknown
}

const CANCEL = 'Cancel'
const CONTINUE = 'Continue'

/**
 * * @deprecated use Modal instead
 * AlertModal variant to prompt user to "Cancel" or "Continue" a given action
 */
export function ContinueModal(props: ContinueModalProps): JSX.Element {
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
