import { when, resetAllWhenMocks } from 'jest-when'
import electron from 'electron'
import * as ProtocolAnalysis from '@opentrons/app/src/redux/protocol-analysis'
import * as Cfg from '@opentrons/app/src/redux/config'

import * as Dialogs from '../../dialogs'
import { Config, getConfig, handleConfigChange } from '../../config'
import { getValidLabwareFilePaths } from '../../labware'
import { selectPythonPath, getPythonPath } from '../getPythonPath'
import { executeAnalyzeCli } from '../executeAnalyzeCli'
import { writeFailedAnalysis } from '../writeFailedAnalysis'

import {
  registerProtocolAnalysis,
  analyzeProtocolSource,
  CONFIG_PYTHON_PATH_TO_PYTHON_OVERRIDE,
} from '..'
import { Dispatch } from '../../types'

jest.mock('../../labware')
jest.mock('../../dialogs')
jest.mock('../getPythonPath')
jest.mock('../executeAnalyzeCli')
jest.mock('../writeFailedAnalysis')

const mockGetConfig = getConfig as jest.MockedFunction<typeof getConfig>
const mockSelectPythonPath = selectPythonPath as jest.MockedFunction<
  typeof selectPythonPath
>
const mockGetPythonPath = getPythonPath as jest.MockedFunction<
  typeof getPythonPath
>
const mockExecuteAnalyzeCli = executeAnalyzeCli as jest.MockedFunction<
  typeof executeAnalyzeCli
>
const mockWriteFailedAnalysis = writeFailedAnalysis as jest.MockedFunction<
  typeof writeFailedAnalysis
>
const mockGetValidLabwareFilePaths = getValidLabwareFilePaths as jest.MockedFunction<
  typeof getValidLabwareFilePaths
>
const mockHandleConfigChange = handleConfigChange as jest.MockedFunction<
  typeof handleConfigChange
>
const mockShowOpenDirectoryDialog = Dialogs.showOpenDirectoryDialog as jest.MockedFunction<
  typeof Dialogs.showOpenDirectoryDialog
>
const mockOpenDirectoryInFileExplorer = Dialogs.openDirectoryInFileExplorer as jest.MockedFunction<
  typeof Dialogs.openDirectoryInFileExplorer
>

// wait a few ticks to let the mock Promises clear
const flush = (): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, 0))

describe('analyzeProtocolSource', () => {
  const mockMainWindow = ({
    browserWindow: true,
  } as unknown) as electron.BrowserWindow
  let dispatch: jest.MockedFunction<Dispatch>
  let handleAction: Dispatch

  beforeEach(() => {
    dispatch = jest.fn()
    mockGetConfig.mockReturnValue({
      python: { pathToPythonOverride: '/some/override/python' },
    } as Config)
    handleAction = registerProtocolAnalysis(dispatch, mockMainWindow)
  })

  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should be able to initialize the Python path', () => {
    expect(mockSelectPythonPath).toHaveBeenCalledWith('/some/override/python')
    expect(mockHandleConfigChange).toHaveBeenCalledWith(
      'python.pathToPythonOverride',
      expect.any(Function)
    )

    // the 'python.pathToPythonOverride' change handler
    const changeHandler = mockHandleConfigChange.mock.calls[0][1]
    changeHandler('/new/override/python', '/old/path/does/not/matter')
    expect(mockSelectPythonPath).toHaveBeenCalledWith('/new/override/python')
  })

  it('should get the Python path and execute the analyze CLI with custom labware', () => {
    const sourcePath = '/path/to/protocol.py'
    const outputPath = '/path/to/output.json'
    const pythonPath = '/path/to/python'
    const labwarePaths = [
      '/some/custom/labware/directory/fakeLabwareOne.json',
      '/some/custom/labware/directory/fakeLabwareTwo.json',
    ]

    when(mockGetPythonPath).calledWith().mockResolvedValue(pythonPath)
    when(mockGetValidLabwareFilePaths)
      .calledWith()
      .mockResolvedValue(labwarePaths)

    return analyzeProtocolSource(sourcePath, outputPath).then(() => {
      expect(mockExecuteAnalyzeCli).toHaveBeenCalledWith(
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

    when(mockGetPythonPath).calledWith().mockRejectedValue(error)
    when(mockGetValidLabwareFilePaths).calledWith().mockResolvedValue([])

    return analyzeProtocolSource(sourcePath, outputPath).then(() => {
      expect(mockWriteFailedAnalysis).toHaveBeenCalledWith(outputPath, 'oh no')
    })
  })

  it('should write analysis execution errors', () => {
    const sourcePath = '/path/to/protocol.py'
    const outputPath = '/path/to/output.json'
    const pythonPath = '/path/to/python'
    const error = new Error('oh no')

    when(mockGetPythonPath).calledWith().mockResolvedValue(pythonPath)
    when(mockGetValidLabwareFilePaths).calledWith().mockResolvedValue([])
    when(mockExecuteAnalyzeCli)
      .calledWith(pythonPath, outputPath, [sourcePath])
      .mockRejectedValue(error)

    return analyzeProtocolSource(sourcePath, outputPath).then(() => {
      expect(mockWriteFailedAnalysis).toHaveBeenCalledWith(outputPath, 'oh no')
    })
  })

  it('should open file picker in response to CHANGE_PYTHON_PATH_OVERRIDE and not call dispatch if no directory is returned from showOpenDirectoryDialog', () => {
    when(mockShowOpenDirectoryDialog)
      .calledWith(mockMainWindow)
      .mockResolvedValue([])
    handleAction(ProtocolAnalysis.changePythonPathOverrideConfig())

    return flush().then(() => {
      expect(mockShowOpenDirectoryDialog).toHaveBeenCalledWith(mockMainWindow)
      expect(dispatch).not.toHaveBeenCalled()
    })
  })

  it('should open file picker in response to CHANGE_PYTHON_PATH_OVERRIDE and call dispatch with directory returned from showOpenDirectoryDialog', () => {
    when(mockShowOpenDirectoryDialog)
      .calledWith(mockMainWindow)
      .mockResolvedValue(['path/to/override'])
    handleAction(ProtocolAnalysis.changePythonPathOverrideConfig())

    return flush().then(() => {
      expect(mockShowOpenDirectoryDialog).toHaveBeenCalledWith(mockMainWindow)
      expect(dispatch).toHaveBeenCalledWith(
        Cfg.updateConfigValue(
          CONFIG_PYTHON_PATH_TO_PYTHON_OVERRIDE,
          'path/to/override'
        )
      )
    })
  })

  it('should call openDirectoryInFileExplorer in response to OPEN_PYTHON_DIRECTORY', () => {
    when(mockOpenDirectoryInFileExplorer)
      .calledWith('/some/override/python')
      .mockResolvedValue(null)
    handleAction(ProtocolAnalysis.openPythonInterpreterDirectory())

    return flush().then(() => {
      expect(mockOpenDirectoryInFileExplorer).toHaveBeenCalledWith(
        '/some/override/python'
      )
    })
  })
})
