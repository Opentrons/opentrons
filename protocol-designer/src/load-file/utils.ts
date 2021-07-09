import { saveAs } from 'file-saver'
import { PDProtocolFile } from '../file-types'
export const saveFile = (fileData: PDProtocolFile, fileName: string): void => {
  const blob = new Blob([JSON.stringify(fileData)], {
    type: 'application/json',
  })
  saveAs(blob, fileName)
}
