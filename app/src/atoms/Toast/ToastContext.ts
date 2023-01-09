import * as React from 'react'

import type { ToastProps, ToastType } from './Toast'

export type MakeToastOptions = Omit<ToastProps, 'id' | 'message' | 'type'>

type MakeToast = (
  message: string,
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
