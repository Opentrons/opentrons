import { mockResolvedValue } from '../../../__util__/mock-promise'
import * as buildroot from '../buildroot'

const { buildroot: mockBuildrootUpdate } = global.APP_SHELL

describe('shell/api-update', () => {
  let _Blob

  beforeEach(() => {
    _Blob = global.Blob
    global.Blob = jest.fn(input => ({ blob: input }))
  })

  afterEach(() => {
    global.Blob = _Blob
    jest.clearAllMocks()
  })

  test('reducer puts update info in state', () => {
    mockBuildrootUpdate.getBuildrootUpdateInfo.mockReturnValue({
      filename: 'foo.zip',
      apiVersion: '1.2.3',
    })

    expect(buildroot.buildrootReducer(undefined, {})).toEqual({
      filename: 'foo.zip',
      apiVersion: '1.2.3',
    })
  })

  test('getBuildrootUpdateContents puts file from app-shell into a Blob', () => {
    const contents = 'update'

    mockResolvedValue(mockBuildrootUpdate.getUpdateFileContents, contents)

    return expect(buildroot.getBuildrootUpdateContents()).resolves.toEqual({
      blob: ['update'],
    })
  })

  describe('selectors', () => {
    const SPECS = [
      {
        name: 'getBuildrootUpdateInfo',
        selector: buildroot.getBuildrootUpdateInfo,
        state: {
          shell: {
            buildroot: {
              filename: 'foobar.zip',
              apiVersion: '1.0.0',
              serverVersion: '1.0.0',
            },
          },
        },
        expected: {
          filename: 'foobar.zip',
          apiVersion: '1.0.0',
          serverVersion: '1.0.0',
        },
      },
    ]

    SPECS.forEach(spec => {
      const { name, selector, state, expected } = spec
      test(name, () => expect(selector(state)).toEqual(expected))
    })
  })
})
