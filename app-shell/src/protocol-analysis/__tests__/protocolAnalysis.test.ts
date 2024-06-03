import { vi, it, expect, describe, beforeEach } from 'vitest'
import { when } from 'vitest-when'
import * as ProtocolAnalysis from '@opentrons/app/src/redux/protocol-analysis'
import * as Cfg from '@opentrons/app/src/redux/config'

import * as Dialogs from '../../dialogs'
import { getConfig, handleConfigChange } from '../../config'
import { getValidLabwareFilePaths } from '../../labware'
import { selectPythonPath, getPythonPath } from '../getPythonPath'
import { executeAnalyzeCli } from '../executeAnalyzeCli'
import { writeFailedAnalysis } from '../writeFailedAnalysis'

import {
  registerProtocolAnalysis,
  analyzeProtocolSource,
  CONFIG_PYTHON_PATH_TO_PYTHON_OVERRIDE,
} from '..'
import type electron from 'electron'
import type { createLogger } from '../../log'
import type { Dispatch } from '../../types'
import type { Config } from '../../config'

vi.mock('../../labware')
vi.mock('../../dialogs')
vi.mock('../getPythonPath')
vi.mock('../executeAnalyzeCli')
vi.mock('../writeFailedAnalysis')
vi.mock('electron-store')
vi.mock('../../config')
vi.mock('../../log', async importOriginal => {
  const actual = await importOriginal<typeof createLogger>()
  return {
    ...actual,
    createLogger: () => ({
      debug: vi.fn(),
      error: vi.fn(),
    }),
  }
})

// wait a few ticks to let the mock Promises clear
const flush = (): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, 0))

describe('analyzeProtocolSource', () => {
  const mockMainWindow = ({
    browserWindow: true,
  } as unknown) as electron.BrowserWindow
  let dispatch = vi.fn()
  let handleAction: Dispatch

  beforeEach(() => {
    dispatch = vi.fn()
    vi.mocked(getConfig).mockReturnValue({
      python: { pathToPythonOverride: '/some/override/python' },
    } as Config)
    handleAction = registerProtocolAnalysis(dispatch, mockMainWindow)
  })

  it('should be able to initialize the Python path', () => {
    expect(vi.mocked(selectPythonPath)).toHaveBeenCalledWith(
      '/some/override/python'
    )
    expect(vi.mocked(handleConfigChange)).toHaveBeenCalledWith(
      'python.pathToPythonOverride',
      expect.any(Function)
    )

    // the 'python.pathToPythonOverride' change handler
    const changeHandler = vi.mocked(handleConfigChange).mock.calls[0][1]
    changeHandler('/new/override/python', '/old/path/does/not/matter')
    expect(vi.mocked(selectPythonPath)).toHaveBeenCalledWith(
      '/new/override/python'
    )
  })

  it('should get the Python path and execute the analyze CLI with custom labware', () => {
    const sourcePath = '/path/to/protocol.py'
    const outputPath = '/path/to/output.json'
    const pythonPath = '/path/to/python'
    const labwarePaths = [
      '/some/custom/labware/directory/fakeLabwareOne.json',
      '/some/custom/labware/directory/fakeLabwareTwo.json',
    ]

    when(vi.mocked(getPythonPath)).calledWith().thenResolve(pythonPath)
    when(vi.mocked(getValidLabwareFilePaths))
      .calledWith()
      .thenResolve(labwarePaths)

    return analyzeProtocolSource(sourcePath, outputPath).then(() => {
      expect(vi.mocked(executeAnalyzeCli)).toHaveBeenCalledWith(
        pythonPath,
        outputPath,
        [sourcePath, ...labwarePaths]
      )
    })
  })

  it('should write Python path errors', () => {
    const sourcePath = '/path/to/protocol.py'
    const outputPath = '/path/to/output.json'
    const error = new Error('oh no')

    when(vi.mocked(getPythonPath)).calledWith().thenReject(error)
    when(vi.mocked(getValidLabwareFilePaths)).calledWith().thenResolve([])

    return analyzeProtocolSource(sourcePath, outputPath).then(() => {
      expect(vi.mocked(writeFailedAnalysis)).toHaveBeenCalledWith(
        outputPath,
        'oh no'
      )
    })
  })

  it('should write analysis execution errors', () => {
    const sourcePath = '/path/to/protocol.py'
    const outputPath = '/path/to/output.json'
    const pythonPath = '/path/to/python'
    const error = new Error('oh no')

    when(vi.mocked(getPythonPath)).calledWith().thenResolve(pythonPath)
    when(vi.mocked(getValidLabwareFilePaths)).calledWith().thenResolve([])
    when(vi.mocked(executeAnalyzeCli))
      .calledWith(pythonPath, outputPath, [sourcePath])
      .thenReject(error)

    return analyzeProtocolSource(sourcePath, outputPath).then(() => {
      expect(vi.mocked(writeFailedAnalysis)).toHaveBeenCalledWith(
        outputPath,
        'oh no'
      )
    })
  })

  it('should open file picker in response to CHANGE_PYTHON_PATH_OVERRIDE and not call dispatch if no directory is returned from showOpenDirectoryDialog', () => {
    when(vi.mocked(Dialogs.showOpenDirectoryDialog))
      .calledWith(mockMainWindow)
      .thenResolve([])
    handleAction(ProtocolAnalysis.changePythonPathOverrideConfig())

    return flush().then(() => {
      expect(vi.mocked(Dialogs.showOpenDirectoryDialog)).toHaveBeenCalledWith(
        mockMainWindow
      )
      expect(dispatch).not.toHaveBeenCalled()
    })
  })

  it('should open file picker in response to CHANGE_PYTHON_PATH_OVERRIDE and call dispatch with directory returned from showOpenDirectoryDialog', () => {
    when(vi.mocked(Dialogs.showOpenDirectoryDialog))
      .calledWith(mockMainWindow)
      .thenResolve(['path/to/override'])
    handleAction(ProtocolAnalysis.changePythonPathOverrideConfig())

    return flush().then(() => {
      expect(vi.mocked(Dialogs.showOpenDirectoryDialog)).toHaveBeenCalledWith(
        mockMainWindow
      )
      expect(dispatch).toHaveBeenCalledWith(
        Cfg.updateConfigValue(
          CONFIG_PYTHON_PATH_TO_PYTHON_OVERRIDE,
          'path/to/override'
        )
      )
    })
  })

  it('should call openDirectoryInFileExplorer in response to OPEN_PYTHON_DIRECTORY', () => {
    when(vi.mocked(Dialogs.openDirectoryInFileExplorer))
      .calledWith('/some/override/python')
      .thenResolve(null)
    handleAction(ProtocolAnalysis.openPythonInterpreterDirectory())

    return flush().then(() => {
      expect(
        vi.mocked(Dialogs.openDirectoryInFileExplorer)
      ).toHaveBeenCalledWith('/some/override/python')
    })
  })
})
