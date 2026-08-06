import Electron from 'electron'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { showSaveDialog } from '../dialogs'

import type { BrowserWindow } from 'electron'

vi.mock('electron')

const mockMainWindow = {} as unknown as BrowserWindow

describe('showSaveDialog', () => {
  beforeEach(() => {
    vi.mocked(Electron.dialog.showSaveDialog).mockClear()
  })

  it('resolves the chosen file path', () => {
    vi.mocked(Electron.dialog.showSaveDialog).mockResolvedValue({
      canceled: false,
      filePath: '/choose/a/path.py',
    })

    return expect(
      showSaveDialog(mockMainWindow, { defaultPath: '/default/path.py' })
    ).resolves.toBe('/choose/a/path.py')
  })

  it('passes defaultPath and filters through to Electron', () => {
    vi.mocked(Electron.dialog.showSaveDialog).mockResolvedValue({
      canceled: false,
      filePath: '/choose/a/path.py',
    })
    const filters = [{ name: 'Python', extensions: ['py'] }]

    return showSaveDialog(mockMainWindow, {
      defaultPath: '/default/path.py',
      filters,
    }).then(() => {
      expect(Electron.dialog.showSaveDialog).toHaveBeenCalledWith(
        mockMainWindow,
        { defaultPath: '/default/path.py', filters }
      )
    })
  })

  it('resolves null when the dialog is canceled', () => {
    vi.mocked(Electron.dialog.showSaveDialog).mockResolvedValue({
      canceled: true,
      filePath: '',
    })

    return expect(showSaveDialog(mockMainWindow)).resolves.toBe(null)
  })
})
