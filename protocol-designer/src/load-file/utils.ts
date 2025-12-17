import { saveAs } from 'file-saver'

import type { PDPythonFile } from '../file-types'

export const saveFile = (file: PDPythonFile, fileName: string): void => {
  const fileData = file.pythonProtocol
  const stringifiedBlob = JSON.stringify(file.designerApplication)
  const designerApplicationBlob = `\nDESIGNER_APPLICATION = """${stringifiedBlob}"""\n`
  const blob = new Blob([fileData, designerApplicationBlob], {
    type: 'text/x-python;charset=UTF-8',
  })
  saveAs(blob, fileName)
}
