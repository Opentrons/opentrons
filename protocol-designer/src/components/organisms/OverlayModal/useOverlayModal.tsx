import { useSelector } from 'react-redux'

import { getDismissedHints } from '/protocol-designer/tutorial/selectors'

import { OverlayModal, OverlayModalProps } from './index'

import type { ReactNode } from 'react'
import type { HintKey } from '/protocol-designer/tutorial'

export interface HintProps {
  /** `enabled` should be a condition that the parent uses to toggle whether the hint should be active or not.
   * If the hint is enabled but has been dismissed, it will automatically call `handleContinue` when enabled.
   * useBlockingHint expects the parent to disable the hint on cancel/continue */
  enabled: boolean
  hintKey: HintKey | null
  content: ReactNode
  handleCancel: () => void
  handleContinue: () => void
}

export const useOverlayModal = (args: OverlayModalProps): JSX.Element | null => {
  const { header, subText, handleCancel, handleContinue, children } = args

  return (
    <OverlayModal
      header={header}
      subText={subText}
      handleCancel={handleCancel}
      handleContinue={handleContinue}
      children={children}
    />
  )
}
