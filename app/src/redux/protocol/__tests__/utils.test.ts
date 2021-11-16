// protocol actions tests
import withModulesProtocol from '@opentrons/shared-data/protocol/fixtures/4/testModulesProtocol.json'
import { ingestProtocolFile } from '../utils'

describe('ingestProtocolFile', () => {
  let _FileReader: any
  let mockReader: any
  let handleSuccess: jest.MockedFunction<any>
  let handleError: jest.MockedFunction<any>

  beforeEach(() => {
    _FileReader = global.FileReader
    mockReader = { readAsText: jest.fn(), readAsArrayBuffer: jest.fn() }
    handleSuccess = jest.fn()
    handleError = jest.fn()

    global.FileReader = jest.fn(() => mockReader) as any
  })

  afterEach(() => {
    jest.resetAllMocks()
    global.FileReader = _FileReader
  })

  it('calls handleSuccess if valid json file', () => {
    const contents = JSON.stringify(withModulesProtocol)
    const jsonFile = new File([contents], 'module_protocol.json')
    mockReader.result = contents
    ingestProtocolFile(jsonFile, handleSuccess, handleError)
    mockReader.onload()
    expect(handleSuccess).toHaveBeenCalledWith(jsonFile, withModulesProtocol)
    expect(handleError).not.toHaveBeenCalled()
  })
  it('calls handleError if invalid json file', () => {
    const jsonFile = new File([''], 'module_protocol.json')
    mockReader.result = ''
    ingestProtocolFile(jsonFile, handleSuccess, handleError)
    mockReader.onload()
    expect(handleSuccess).toHaveBeenCalledWith(jsonFile, null)
    expect(handleError).toHaveBeenCalled()
  })
})
