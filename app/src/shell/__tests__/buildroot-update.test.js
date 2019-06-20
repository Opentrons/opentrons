import { mockResolvedValue } from '../../../__util__/mock-promise'
import * as buildroot from '../buildroot-update'

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

    expect(buildroot.buildrootUpdateReducer(undefined, {})).toEqual({
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
        name: 'getBuildrootApiUpdateVersion',
        selector: buildroot.getBuildrootApiUpdateVersion,
        state: { shell: { buildroot: { apiVersion: '1.0.0' } } },
        expected: '1.0.0',
      },
      {
        name: 'getBuildrootServerUpdateVersion',
        selector: buildroot.getBuildrootServerUpdateVersion,
        state: { shell: { buildroot: { serverVersion: '1.0.0' } } },
        expected: '1.0.0',
      },
      {
        name: 'getBuildrootUpdateFilename',
        selector: buildroot.getBuildrootUpdateFilename,
        state: {
          shell: {
            buildroot: {
              filename: 'foobar.zip',
              apiVersion: '1.0.0',
              serverVersion: '1.0.0',
            },
          },
        },
        expected: 'foobar.zip',
      },
    ]

    SPECS.forEach(spec => {
      const { name, selector, state, expected } = spec
      test(name, () => expect(selector(state)).toEqual(expected))
    })
  })
})
