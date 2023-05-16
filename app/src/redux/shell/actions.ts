import type { UiInitializedAction, UsbRequestsAction } from './types'

export const UI_INITIALIZED: 'shell:UI_INITIALIZED' = 'shell:UI_INITIALIZED'
export const USB_HTTP_REQUESTS_START: 'shell:USB_HTTP_REQUESTS_START' =
  'shell:USB_HTTP_REQUESTS_START'
export const USB_HTTP_REQUESTS_STOP: 'shell:USB_HTTP_REQUESTS_STOP' =
  'shell:USB_HTTP_REQUESTS_STOP'

export const uiInitialized = (): UiInitializedAction => ({
  type: UI_INITIALIZED,
  meta: { shell: true },
})

export const usbRequestsStart = (): UsbRequestsAction => ({
  type: USB_HTTP_REQUESTS_START,
  meta: { shell: true },
})

export const usbRequestsStop = (): UsbRequestsAction => ({
  type: USB_HTTP_REQUESTS_STOP,
  meta: { shell: true },
})
