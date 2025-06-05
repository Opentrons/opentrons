import { saveAs } from 'file-saver'

import type { ProtocolFile } from '@opentrons/shared-data'
import type { PDPythonFile } from '../file-types'

export const saveFile = (fileData: ProtocolFile, fileName: string): void => {
  const blob = new Blob([JSON.stringify(fileData, null, 2)], {
    type: 'application/json',
  })
  saveAs(blob, fileName)
}
export const savePythonFile = (file: PDPythonFile, fileName: string): void => {
  const fileData = file.pythonProtocol
  const stringifiedBlob = JSON.stringify(file.designerApplication)
  const designerApplicationBlob = `\nDESIGNER_APPLICATION = """${stringifiedBlob}"""\n`
  const blob = new Blob([fileData, designerApplicationBlob], {
    type: 'text/x-python;charset=UTF-8',
  })
  // For now, show the generated Python in a new window instead of saving it to a file.
  // (A saved Python file wouldn't be runnable anyway until we finish this project.)
  window.open(URL.createObjectURL(blob), '_blank')
}
