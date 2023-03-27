import * as React from 'react'

import type { ToastProps, ToastType } from './Toast'
import type { SnackbarProps } from '../Snackbar/Snackbar'

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
  eatSnackbar: EatSnackbar
  makeSnackbar: MakeSnackbar
}

export const ToastContext = React.createContext<ToastContextType>({
  eatToast: () => {},
  makeToast: () => '',
  eatSnackbar: () => {},
  makeSnackbar: () => {},
})

export type MakeSnackbarOptions = Omit<SnackbarProps, 'message'>

type MakeSnackbar = (message: string, options?: MakeSnackbarOptions) => void

type EatSnackbar = () => void
