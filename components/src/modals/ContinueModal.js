// @flow
import * as React from 'react'

import { AlertModal } from './AlertModal'

import type { AlertModalProps } from './AlertModal'

export type ContinueModalProps = {|
  ...$Diff<AlertModalProps, { buttons: mixed }>,
  onCancelClick: () => mixed,
  onContinueClick: () => mixed,
|}

const CANCEL = 'Cancel'
const CONTINUE = 'Continue'

/**
 * AlertModal variant to prompt user to "Cancel" or "Continue" a given action
 */
export function ContinueModal(props: ContinueModalProps) {
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
