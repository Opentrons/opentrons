import type { ProtocolFile } from '@opentrons/shared-data'
import { saveAs } from 'file-saver'

export const saveFile = (fileData: ProtocolFile, fileName: string): void => {
  const blob = new Blob([JSON.stringify(fileData)], {
    type: 'application/json',
  })
  saveAs(blob, fileName)
}
