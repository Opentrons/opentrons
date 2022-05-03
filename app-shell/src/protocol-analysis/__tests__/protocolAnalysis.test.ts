import { when, resetAllWhenMocks } from 'jest-when'

import { initializePython, analyzeProtocolSource } from '..'

import { Config, getConfig } from '../../config'
import { selectPythonPath, getPythonPath } from '../getPythonPath'
import { executeAnalyzeCli } from '../executeAnalyzeCli'
import { writeFailedAnalysis } from '../writeFailedAnalysis'

jest.mock('../../config')
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
  })

  it('should get the Python path and execute the analyze CLI', () => {
    const sourcePath = '/path/to/protocol.py'
    const outputPath = '/path/to/output.json'
    const pythonPath = '/path/to/python'

    when(mockGetPythonPath).calledWith().mockResolvedValue(pythonPath)

    return analyzeProtocolSource(sourcePath, outputPath).then(() => {
      expect(mockExecuteAnalyzeCli).toHaveBeenCalledWith(
        pythonPath,
        sourcePath,
        outputPath
      )
    })
  })

  it('should write Python path errors', () => {
    const sourcePath = '/path/to/protocol.py'
    const outputPath = '/path/to/output.json'
    const error = new Error('oh no')

    when(mockGetPythonPath).calledWith().mockRejectedValue(error)

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
    when(mockExecuteAnalyzeCli)
      .calledWith(pythonPath, sourcePath, outputPath)
      .mockRejectedValue(error)

    return analyzeProtocolSource(sourcePath, outputPath).then(() => {
      expect(mockWriteFailedAnalysis).toHaveBeenCalledWith(outputPath, 'oh no')
    })
  })
})
