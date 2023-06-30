import * as React from 'react'
import { useSelector } from 'react-redux'
import { v4 as uuidv4 } from 'uuid'

import {
  Flex,
  ALIGN_CENTER,
  ALIGN_FLEX_END,
  DIRECTION_COLUMN_REVERSE,
  JUSTIFY_CENTER,
  POSITION_FIXED,
  SPACING,
} from '@opentrons/components'

import { Snackbar } from '../../atoms/Snackbar'
import { Toast } from '../../atoms/Toast'
import { getIsOnDevice } from '../../redux/config'
import { ToasterContext } from './ToasterContext'

import type { SnackbarProps } from '../../atoms/Snackbar'
import type { ToastProps, ToastType } from '../../atoms/Toast'
import type { MakeSnackbarOptions, MakeToastOptions } from './ToasterContext'

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
  const [snackbar, setSnackbar] = React.useState<SnackbarProps | null>(null)

  const isOnDevice = useSelector(getIsOnDevice) ?? null
  const displayType: 'desktop' | 'odd' =
    isOnDevice != null && isOnDevice ? 'odd' : 'desktop'

  /**
   * makes toast, rendering it in the toaster oven display container
   * @param {string} message
   * @param {ToastType} type
   * @param {MakeToastOptions} options
   * @returns {string} returns the id to allow imperative eatToast close from caller
   */
  function makeToast(
    message: string,
    type: ToastType,
    options?: MakeToastOptions
  ): string {
    const id = uuidv4()

    setToasts(t =>
      [{ id, message, type, ...options }, ...t].slice(0, TOASTER_OVEN_SIZE)
    )

    return id
  }

  function makeSnackbar(message: string, options?: MakeSnackbarOptions): void {
    setSnackbar({ message, ...options })
  }

  // This function is needed to actually make the snackbar auto-close in the context of the
  // ToasterOven. It closes fine by itself in tests and storybook, but we need to eat it
  // here to remove it from the page as a whole.
  function eatSnackbar(): void {
    setSnackbar(null)
  }

  /**
   * removes (eats) a toast from toaster oven display container
   * @param {string} toastId the id of the toast to remove
   */
  function eatToast(toastId: string): void {
    setToasts(t => t.filter(toast => toast.id !== toastId))
  }

  return (
    <ToasterContext.Provider value={{ eatToast, makeToast, makeSnackbar }}>
      {toasts.length > 0 ? (
        <Flex
          flexDirection={DIRECTION_COLUMN_REVERSE}
          gridGap={SPACING.spacing8}
          alignItems={ALIGN_FLEX_END}
          position={POSITION_FIXED}
          right={SPACING.spacing32}
          bottom={SPACING.spacing16}
          zIndex={1000}
          width="100%"
        >
          {toasts.map(toast => (
            <Toast
              {...toast}
              displayType={displayType}
              key={toast.id}
              onClose={() => {
                toast.onClose?.()
                eatToast(toast.id)
              }}
            />
          ))}
        </Flex>
      ) : null}
      {snackbar !== null && (
        <Flex
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_CENTER}
          width="100%"
          position="absolute"
          bottom={SPACING.spacing40}
          zIndex={1000}
          onClick={() => {
            eatSnackbar()
          }}
        >
          <Snackbar
            {...snackbar}
            onClose={() => {
              snackbar.onClose?.()
              eatSnackbar()
            }}
          />
        </Flex>
      )}
      {children}
    </ToasterContext.Provider>
  )
}
