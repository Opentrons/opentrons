// @flow
import { dialog } from 'electron'

type DialogResult = {| canceled: boolean, filePaths: Array<string> |}

type BaseDialogOptions = $Shape<{|
  defaultPath: string,
|}>

type FileDialogOptions = $Shape<{|
  ...BaseDialogOptions,
  filters: Array<{| name: string, extensions: Array<string> |}>,
|}>

const BASE_DIRECTORY_OPTS = {
  properties: ['openDirectory', 'createDirectory'],
}

const BASE_FILE_OPTS = {
  properties: ['openFile'],
}

export function showOpenDirectoryDialog(
  browserWindow: mixed,
  options: BaseDialogOptions = {}
): Promise<Array<String>> {
  let openDialogOpts = BASE_DIRECTORY_OPTS

  if (options.defaultPath) {
    openDialogOpts = { ...openDialogOpts, defaultPath: options.defaultPath }
  }

  return dialog
    .showOpenDialog(browserWindow, openDialogOpts)
    .then((result: DialogResult) => {
      return result.canceled ? [] : result.filePaths
    })
}

export function showOpenFileDialog(
  browserWindow: mixed,
  options: FileDialogOptions = {}
): Promise<Array<string>> {
  let openDialogOpts = BASE_FILE_OPTS

  if (options.defaultPath) {
    openDialogOpts = { ...openDialogOpts, defaultPath: options.defaultPath }
  }

  if (options.filters) {
    openDialogOpts = { ...openDialogOpts, filters: options.filters }
  }

  return dialog
    .showOpenDialog(browserWindow, openDialogOpts)
    .then((result: DialogResult) => {
      return result.canceled ? [] : result.filePaths
    })
}
