// @flow
import { saveAs } from 'file-saver'
import type { PDProtocolFile } from '../file-types'

export const saveFile = (fileData: PDProtocolFile, fileName: string) => {
  const blob = new Blob([JSON.stringify(fileData)], {
    type: 'application/json',
  })
  saveAs(blob, fileName)
}
