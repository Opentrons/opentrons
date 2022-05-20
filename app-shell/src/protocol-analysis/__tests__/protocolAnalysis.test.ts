import { when, resetAllWhenMocks } from 'jest-when'
import { sync } from 'globby'

import { initializePython, analyzeProtocolSource } from '..'

import { Config, getConfig } from '../../config'
import { selectPythonPath, getPythonPath } from '../getPythonPath'
import { executeAnalyzeCli } from '../executeAnalyzeCli'
import { writeFailedAnalysis } from '../writeFailedAnalysis'

jest.mock('globby')
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
const mockGlobbySync = sync as jest.MockedFunction<typeof sync>

describe('analyzeProtocolSource', () => {
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should be able to initialize the Python path', () => {
    when(mockGetConfig)
      .calledWith()
      .mockReturnValue({
        python: { pathToPythonOverride: '/some/override/python' },
        labware: { directory: '/some/custom/labware/directory' },
      } as Config)

    initializePython()

    expect(mockSelectPythonPath).toHaveBeenCalledWith('/some/override/python')
  })

  it('should get the Python path and execute the analyze CLI with custom labware', () => {
    const sourcePath = '/path/to/protocol.py'
    const outputPath = '/path/to/output.json'
    const pythonPath = '/path/to/python'

    when(mockGetConfig)
      .calledWith()
      .mockReturnValue({
        python: { pathToPythonOverride: '/some/override/python' },
        labware: { directory: '/some/custom/labware/directory' },
      } as Config)
    when(mockGetPythonPath).calledWith().mockResolvedValue(pythonPath)
    when(mockGlobbySync)
      .calledWith('/some/custom/labware/directory/**')
      .mockReturnValue([
        '/some/custom/labware/directory/fakeLabwareOne.json',
        '/some/custom/labware/directory/fakeLabwareTwo.json',
      ])

    return analyzeProtocolSource(sourcePath, outputPath).then(() => {
      expect(mockExecuteAnalyzeCli).toHaveBeenCalledWith(
        pythonPath,
        sourcePath,
        outputPath,
        '/some/custom/labware/directory/fakeLabwareOne.json',
        '/some/custom/labware/directory/fakeLabwareTwo.json'
      )
    })
  })

  it('should write Python path errors', () => {
    const sourcePath = '/path/to/protocol.py'
    const outputPath = '/path/to/output.json'
    const error = new Error('oh no')

    when(mockGetConfig)
      .calledWith()
      .mockReturnValue({
        python: { pathToPythonOverride: '/some/override/python' },
        labware: { directory: '/some/custom/labware/directory' },
      } as Config)
    when(mockGlobbySync)
      .calledWith('/some/custom/labware/directory/**')
      .mockReturnValue([])
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

    when(mockGetConfig)
      .calledWith()
      .mockReturnValue({
        python: { pathToPythonOverride: '/some/override/python' },
        labware: { directory: '/some/custom/labware/directory' },
      } as Config)
    when(mockGlobbySync)
      .calledWith('/some/custom/labware/directory/**')
      .mockReturnValue([])
    when(mockGetPythonPath).calledWith().mockResolvedValue(pythonPath)
    when(mockExecuteAnalyzeCli)
      .calledWith(pythonPath, sourcePath, outputPath)
      .mockRejectedValue(error)

    return analyzeProtocolSource(sourcePath, outputPath).then(() => {
      expect(mockWriteFailedAnalysis).toHaveBeenCalledWith(outputPath, 'oh no')
    })
  })
})
