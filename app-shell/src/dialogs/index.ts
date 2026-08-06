import { dialog, shell } from 'electron'

import type {
  BrowserWindow,
  OpenDialogOptions,
  OpenDialogReturnValue,
  SaveDialogOptions,
  SaveDialogReturnValue,
} from 'electron'

interface BaseDialogOptions {
  defaultPath: string
}

interface FileDialogOptions extends BaseDialogOptions {
  filters: Array<{ name: string; extensions: string[] }>
  properties: Array<
    | 'openDirectory'
    | 'createDirectory'
    | 'openFile'
    | 'multiSelections'
    | 'showHiddenFiles'
    | 'promptToCreate'
    | 'noResolveAliases'
    | 'treatPackageAsDirectory'
    | 'dontAddToRecent'
  >
}

const BASE_DIRECTORY_OPTS = {
  properties: ['openDirectory' as const, 'createDirectory' as const],
}

const BASE_FILE_OPTS = {
  properties: ['openFile' as const],
}

export function showOpenDirectoryDialog(
  browserWindow: BrowserWindow,
  options: Partial<BaseDialogOptions> = {}
): Promise<String[]> {
  let openDialogOpts: OpenDialogOptions = BASE_DIRECTORY_OPTS

  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (options.defaultPath) {
    openDialogOpts = { ...openDialogOpts, defaultPath: options.defaultPath }
  }

  return dialog
    .showOpenDialog(browserWindow, openDialogOpts)
    .then((result: OpenDialogReturnValue) => {
      return result.canceled ? [] : (result.filePaths as string[])
    })
}

export function showOpenFileDialog(
  browserWindow: BrowserWindow,
  options: Partial<FileDialogOptions> = {}
): Promise<string[]> {
  let openDialogOpts: OpenDialogOptions = BASE_FILE_OPTS

  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (options.defaultPath) {
    openDialogOpts = { ...openDialogOpts, defaultPath: options.defaultPath }
  }

  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (options.filters) {
    openDialogOpts = { ...openDialogOpts, filters: options.filters }
  }

  if (options.properties != null) {
    openDialogOpts = {
      ...openDialogOpts,
      properties: [...(openDialogOpts.properties ?? []), ...options.properties],
    }
  }

  return dialog
    .showOpenDialog(browserWindow, openDialogOpts)
    .then((result: OpenDialogReturnValue) => {
      return result.canceled ? [] : (result.filePaths as string[])
    })
}

export function showSaveDialog(
  browserWindow: BrowserWindow,
  options: Partial<Omit<FileDialogOptions, 'properties'>> = {}
): Promise<string | null> {
  let saveDialogOpts: SaveDialogOptions = {}

  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (options.defaultPath) {
    saveDialogOpts = { ...saveDialogOpts, defaultPath: options.defaultPath }
  }

  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (options.filters) {
    saveDialogOpts = { ...saveDialogOpts, filters: options.filters }
  }

  return dialog
    .showSaveDialog(browserWindow, saveDialogOpts)
    .then((result: SaveDialogReturnValue) => {
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      return result.canceled || !result.filePath ? null : result.filePath
    })
}

export function openDirectoryInFileExplorer(
  directory: string | null
): Promise<string | null> {
  if (directory == null) return Promise.resolve(null)
  return shell.openPath(directory)
}
