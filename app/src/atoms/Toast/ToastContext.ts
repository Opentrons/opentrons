import * as React from 'react'

import type { IconProps } from '@opentrons/components'
import type { ToastType } from './Toast'

export interface MakeToastOptions {
  closeButton?: boolean
  disableTimeout?: boolean
  duration?: number
  icon?: IconProps
  onClose?: () => void
}

type MakeToast = (
  message: string | JSX.Element,
  type: ToastType,
  options?: MakeToastOptions
) => string

type EatToast = (toastId: string) => void

export interface ToastContextType {
  eatToast: EatToast
  makeToast: MakeToast
}

export const ToastContext = React.createContext<ToastContextType>({
  eatToast: () => {},
  makeToast: () => '',
})
