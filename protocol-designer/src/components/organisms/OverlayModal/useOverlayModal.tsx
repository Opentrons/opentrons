import { OverlayModal, OverlayModalProps } from './index'

import type { ReactNode } from 'react'

export interface OverlayProps {
  header: string
  subText?: string
  children: ReactNode
  handleCancel: () => void
  handleContinue: () => void
  enabled: boolean
}

export const useOverlayModal = (
  args: OverlayModalProps
): JSX.Element | null => {
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
