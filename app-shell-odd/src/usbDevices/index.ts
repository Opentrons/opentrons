import { ipcMain } from 'electron'

import { getUsbDevices } from './usbDevices'

export function registerUsbDeviceHandlers(): void {
  ipcMain.handle('usb:getDevices', async () => {
    return await getUsbDevices()
  })
}
