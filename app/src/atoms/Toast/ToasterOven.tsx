import * as React from 'react'

import {
  Flex,
  ALIGN_FLEX_END,
  DIRECTION_COLUMN_REVERSE,
  POSITION_FIXED,
  SPACING,
} from '@opentrons/components'

import { Toast } from './Toast'
import { ToastContext } from './ToastContext'

import type { ToastProps, ToastType } from './Toast'
import type { MakeToastOptions } from './ToastContext'

interface ToasterOvenProps {
  children: React.ReactNode
}

const TOASTER_OVEN_SIZE = 5

/**
 * A toaster oven that renders up to 5 toasts in an app-level display container
 * @param children passes through and renders children
 * @returns
 */
export function ToasterOven({ children }: ToasterOvenProps): JSX.Element {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  /**
   * makes toast, rendering it in the toaster oven display container
   * @param {string | JSX.Element} message
   * @param {ToastType} type
   * @param {MakeToastOptions} options
   * @returns {string} returns the id to allow imperative eatToast close from caller
   */
  function makeToast(
    message: string | JSX.Element,
    type: ToastType,
    options?: MakeToastOptions
  ): string {
    const id = JSON.stringify(Date.now())

    setToasts(t =>
      [{ id, message, type, ...options }, ...t].slice(0, TOASTER_OVEN_SIZE)
    )

    return id
  }

  /**
   * removes (eats) a toast from toaster oven display container
   * @param {string} toastId the id of the toast to remove
   */
  function eatToast(toastId: string): void {
    setToasts(t => t.filter(toast => toast.id !== toastId))
  }

  return (
    <ToastContext.Provider value={{ eatToast, makeToast }}>
      {toasts.length > 0 ? (
        <Flex
          flexDirection={DIRECTION_COLUMN_REVERSE}
          gridGap={SPACING.spacing3}
          alignItems={ALIGN_FLEX_END}
          position={POSITION_FIXED}
          right={SPACING.spacing6}
          bottom={SPACING.spacing4}
          zIndex={1000}
        >
          {toasts.map(toast => (
            <Toast
              {...toast}
              key={toast.id}
              onClose={() => {
                toast.onClose?.()
                eatToast(toast.id)
              }}
            />
          ))}
        </Flex>
      ) : null}
      {children}
    </ToastContext.Provider>
  )
}
