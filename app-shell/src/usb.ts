import { SerialPortHttpAgent } from '@opentrons/usb-bridge/node-client'

import { createLogger } from './log'

let usbHttpAgent: SerialPortHttpAgent | undefined
const usbLog = createLogger('usb')

export function getSerialPortHttpAgent(): SerialPortHttpAgent | undefined {
  return usbHttpAgent
}

export function createSerialPortHttpAgent(path: string): void {
  const serialPortHttpAgent = new SerialPortHttpAgent({
    maxFreeSockets: 1,
    maxSockets: 1,
    maxTotalSockets: 1,
    keepAlive: true,
    keepAliveMsecs: 10000,
    path,
    logger: usbLog,
  })

  usbHttpAgent = serialPortHttpAgent
}

export function destroyUsbHttpAgent(): void {
  if (usbHttpAgent != null) {
    usbHttpAgent.destroy()
  }
  usbHttpAgent = undefined
}
