import Electron from 'electron'
import { describe, it, expect, vi } from 'vitest'
import * as Dialogs from '..'

vi.mock('electron')

const mockMainWindow = ({
  mainWindow: true,
} as unknown) as Electron.BrowserWindow

describe('dialog boxes', () => {
  describe('showOpenDirectoryDialog', () => {
    it('directory select with cancel', () => {
      vi.mocked(Electron.dialog.showOpenDialog).mockResolvedValue({
        canceled: true,
        filePaths: [],
      })

      return Dialogs.showOpenDirectoryDialog(mockMainWindow).then(filePaths => {
        expect(vi.mocked(Electron.dialog.showOpenDialog)).toHaveBeenCalledWith(
          mockMainWindow,
          {
            properties: ['openDirectory', 'createDirectory'],
          }
        )
        expect(filePaths).toEqual([])
      })
    })

    it('directory select with files', () => {
      vi.mocked(Electron.dialog.showOpenDialog).mockResolvedValue({
        canceled: false,
        filePaths: ['/path/to/dir'],
      })

      return Dialogs.showOpenDirectoryDialog(mockMainWindow).then(filePaths => {
        expect(vi.mocked(Electron.dialog.showOpenDialog)).toHaveBeenCalledWith(
          mockMainWindow,
          {
            properties: ['openDirectory', 'createDirectory'],
          }
        )
        expect(filePaths).toEqual(['/path/to/dir'])
      })
    })

    it('directory select with default location', () => {
      vi.mocked(Electron.dialog.showOpenDialog).mockResolvedValue({
        canceled: false,
        filePaths: ['/path/to/dir'],
      })

      return Dialogs.showOpenDirectoryDialog(mockMainWindow, {
        defaultPath: '/foo',
      }).then(filePaths => {
        expect(vi.mocked(Electron.dialog.showOpenDialog)).toHaveBeenCalledWith(
          mockMainWindow,
          {
            properties: ['openDirectory', 'createDirectory'],
            defaultPath: '/foo',
          }
        )
        expect(filePaths).toEqual(['/path/to/dir'])
      })
    })
  })

  describe('showOpenFileDialog', () => {
    it('file select with cancel', () => {
      vi.mocked(Electron.dialog.showOpenDialog).mockResolvedValue({
        canceled: true,
        filePaths: [],
      })

      return Dialogs.showOpenFileDialog(mockMainWindow).then(filePaths => {
        expect(vi.mocked(Electron.dialog.showOpenDialog)).toHaveBeenCalledWith(
          mockMainWindow,
          {
            properties: ['openFile'],
          }
        )
        expect(filePaths).toEqual([])
      })
    })

    it('file select with files', () => {
      vi.mocked(Electron.dialog.showOpenDialog).mockResolvedValue({
        canceled: false,
        filePaths: ['/path/to/file.json'],
      })

      return Dialogs.showOpenFileDialog(mockMainWindow).then(filePaths => {
        expect(vi.mocked(Electron.dialog.showOpenDialog)).toHaveBeenCalledWith(
          mockMainWindow,
          {
            properties: ['openFile'],
          }
        )
        expect(filePaths).toEqual(['/path/to/file.json'])
      })
    })

    it('file select with filters', () => {
      vi.mocked(Electron.dialog.showOpenDialog).mockResolvedValue({
        canceled: false,
        filePaths: ['/path/to/file.json'],
      })

      const options = { filters: [{ name: 'JSON', extensions: ['json'] }] }

      return Dialogs.showOpenFileDialog(mockMainWindow, options).then(
        filePaths => {
          expect(
            vi.mocked(Electron.dialog.showOpenDialog)
          ).toHaveBeenCalledWith(mockMainWindow, {
            properties: ['openFile'],
            filters: [{ name: 'JSON', extensions: ['json'] }],
          })
          expect(filePaths).toEqual(['/path/to/file.json'])
        }
      )
    })

    it('file select with default location', () => {
      vi.mocked(Electron.dialog.showOpenDialog).mockResolvedValue({
        canceled: false,
        filePaths: ['/path/to/file.json'],
      })

      return Dialogs.showOpenFileDialog(mockMainWindow, {
        defaultPath: '/foo',
      }).then(filePaths => {
        expect(vi.mocked(Electron.dialog.showOpenDialog)).toHaveBeenCalledWith(
          mockMainWindow,
          {
            properties: ['openFile'],
            defaultPath: '/foo',
          }
        )
        expect(filePaths).toEqual(['/path/to/file.json'])
      })
    })
  })
})
