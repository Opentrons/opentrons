import {mockResolvedValue} from '../../../__util__/mock-promise'
import * as apiUpdate from '../api-update'

const {apiUpdate: mockApiUpdate} = global.APP_SHELL

describe('shell/api-update', () => {
  let _Blob

  beforeEach(() => {
    _Blob = global.Blob
    global.Blob = jest.fn(input => ({blob: input}))
  })

  afterEach(() => {
    global.Blob = _Blob
    jest.clearAllMocks()
  })

  test('reducer puts update info in state', () => {
    mockApiUpdate.getUpdateInfo.mockReturnValue({
      filename: 'foo.whl',
      version: '1.2.3',
    })

    expect(apiUpdate.apiUpdateReducer(undefined, {})).toEqual({
      filename: 'foo.whl',
      version: '1.2.3',
    })
  })

  test('getApiUpdateContents puts file from app-shell into a Blob', () => {
    const contents = 'update'

    mockResolvedValue(mockApiUpdate.getUpdateFileContents, contents)

    return expect(apiUpdate.getApiUpdateContents()).resolves.toEqual({
      blob: ['update'],
    })
  })

  describe('selectors', () => {
    const SPECS = [
      {
        name: 'getApiUpdateVersion',
        selector: apiUpdate.getApiUpdateVersion,
        state: {shell: {apiUpdate: {version: '1.0.0'}}},
        expected: '1.0.0',
      },
      {
        name: 'getApiUpdateFilename',
        selector: apiUpdate.getApiUpdateFilename,
        state: {shell: {apiUpdate: {filename: 'foobar.whl', version: '1.0.0'}}},
        expected: 'foobar.whl',
      },
    ]

    SPECS.forEach(spec => {
      const {name, selector, state, expected} = spec
      test(name, () => expect(selector(state)).toEqual(expected))
    })
  })
})
