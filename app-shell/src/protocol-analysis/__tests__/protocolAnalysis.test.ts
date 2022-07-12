import { when, resetAllWhenMocks } from 'jest-when'

import { Config, getConfig, handleConfigChange } from '../../config'
import { getValidLabwareFilePaths } from '../../labware'
import { selectPythonPath, getPythonPath } from '../getPythonPath'
import { executeAnalyzeCli } from '../executeAnalyzeCli'
import { writeFailedAnalysis } from '../writeFailedAnalysis'

import { initializePython, analyzeProtocolSource } from '..'

jest.mock('../../labware')
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

describe('analyzeProtocolSource', () => {
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should be able to initialize the Python path', () => {
    when(mockGetConfig)
      .calledWith()
      .mockReturnValue({
        python: { pathToPythonOverride: '/some/override/python' },
      } as Config)

    initializePython()

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
})
