// @flow

import Electron from 'electron'

import * as Dialogs from '..'

jest.mock('electron')

const mockShowOpenDialog: JestMockFn<
  Array<any>,
  {| canceled: boolean, filePaths: Array<string> |}
> = Electron.dialog.showOpenDialog

const mockMainWindow = { mainWindow: true }

describe('dialog boxes', () => {
  describe('showOpenDirectoryDialog', () => {
    test('directory select with cancel', () => {
      mockShowOpenDialog.mockResolvedValue({ canceled: true, filePaths: [] })

      return Dialogs.showOpenDirectoryDialog(mockMainWindow).then(filePaths => {
        expect(mockShowOpenDialog).toHaveBeenCalledWith(mockMainWindow, {
          properties: ['openDirectory', 'createDirectory'],
        })
        expect(filePaths).toEqual([])
      })
    })

    test('directory select with files', () => {
      mockShowOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: ['/path/to/dir'],
      })

      return Dialogs.showOpenDirectoryDialog(mockMainWindow).then(filePaths => {
        expect(mockShowOpenDialog).toHaveBeenCalledWith(mockMainWindow, {
          properties: ['openDirectory', 'createDirectory'],
        })
        expect(filePaths).toEqual(['/path/to/dir'])
      })
    })

    test('directory select with default location', () => {
      mockShowOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: ['/path/to/dir'],
      })

      return Dialogs.showOpenDirectoryDialog(mockMainWindow, {
        defaultPath: '/foo',
      }).then(filePaths => {
        expect(mockShowOpenDialog).toHaveBeenCalledWith(mockMainWindow, {
          properties: ['openDirectory', 'createDirectory'],
          defaultPath: '/foo',
        })
        expect(filePaths).toEqual(['/path/to/dir'])
      })
    })
  })

  describe('showOpenFileDialog', () => {
    test('file select with cancel', () => {
      mockShowOpenDialog.mockResolvedValue({ canceled: true, filePaths: [] })

      return Dialogs.showOpenFileDialog(mockMainWindow).then(filePaths => {
        expect(mockShowOpenDialog).toHaveBeenCalledWith(mockMainWindow, {
          properties: ['openFile'],
        })
        expect(filePaths).toEqual([])
      })
    })

    test('file select with files', () => {
      mockShowOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: ['/path/to/file.json'],
      })

      return Dialogs.showOpenFileDialog(mockMainWindow).then(filePaths => {
        expect(mockShowOpenDialog).toHaveBeenCalledWith(mockMainWindow, {
          properties: ['openFile'],
        })
        expect(filePaths).toEqual(['/path/to/file.json'])
      })
    })

    test('file select with filters', () => {
      mockShowOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: ['/path/to/file.json'],
      })

      const options = { filters: [{ name: 'JSON', extensions: ['json'] }] }

      return Dialogs.showOpenFileDialog(mockMainWindow, options).then(
        filePaths => {
          expect(mockShowOpenDialog).toHaveBeenCalledWith(mockMainWindow, {
            properties: ['openFile'],
            filters: [{ name: 'JSON', extensions: ['json'] }],
          })
          expect(filePaths).toEqual(['/path/to/file.json'])
        }
      )
    })

    test('file select with default location', () => {
      mockShowOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: ['/path/to/file.json'],
      })

      return Dialogs.showOpenFileDialog(mockMainWindow, {
        defaultPath: '/foo',
      }).then(filePaths => {
        expect(mockShowOpenDialog).toHaveBeenCalledWith(mockMainWindow, {
          properties: ['openFile'],
          defaultPath: '/foo',
        })
        expect(filePaths).toEqual(['/path/to/file.json'])
      })
    })
  })
})
