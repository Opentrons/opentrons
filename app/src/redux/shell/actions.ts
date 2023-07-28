import type {
  UiInitializedAction,
  UsbRequestsAction,
  AppRestartAction,
  SendLogAction,
} from './types'

export const UI_INITIALIZED: 'shell:UI_INITIALIZED' = 'shell:UI_INITIALIZED'
export const USB_HTTP_REQUESTS_START: 'shell:USB_HTTP_REQUESTS_START' =
  'shell:USB_HTTP_REQUESTS_START'
export const USB_HTTP_REQUESTS_STOP: 'shell:USB_HTTP_REQUESTS_STOP' =
  'shell:USB_HTTP_REQUESTS_STOP'
export const APP_RESTART: 'shell:APP_RESTART' = 'shell:APP_RESTART'
export const SEND_LOG: 'shell:SEND_LOG' = 'shell:SEND_LOG'

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

export const appRestart = (message: string): AppRestartAction => ({
  type: APP_RESTART,
  payload: {
    message: message,
  },
  meta: { shell: true },
})

export const sendLog = (message: string): SendLogAction => ({
  type: SEND_LOG,
  payload: {
    message: message,
  },
  meta: { shell: true },
})
