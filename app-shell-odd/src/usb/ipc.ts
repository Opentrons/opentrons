import { writeFile } from 'fs/promises'

import { ipcMain } from 'electron'

import { getUsbDevices } from './devices'

export function registerUsbDeviceHandlers(): void {
  ipcMain.handle('usb:getDevices', async () => {
    return await getUsbDevices()
  })

  ipcMain.handle(
    'usb:saveFile',
    async (_, { filePath, buffer }: { filePath: string; buffer: ArrayBuffer }) => {
      await writeFile(filePath, Buffer.from(buffer))
    }
  )
}
