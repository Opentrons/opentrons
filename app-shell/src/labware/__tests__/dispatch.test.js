// @flow

import fse from 'fs-extra'
import Electron from 'electron'
import * as Cfg from '../../config'
import * as Defs from '../definitions'
import * as Val from '../validation'
import { registerLabware } from '..'

import validLabwareA from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'

import type { Config } from '@opentrons/app/src/config/types'
import type {
  UncheckedLabwareFile,
  CheckedLabwareFile,
} from '@opentrons/app/src/custom-labware/types'

jest.mock('fs-extra')
jest.mock('electron')
jest.mock('../../config')
jest.mock('../definitions')
jest.mock('../validation')

const ensureDir: JestMockFn<[string], void> = fse.ensureDir

const getFullConfig: JestMockFn<[], $Shape<Config>> = Cfg.getFullConfig

const handleConfigChange: JestMockFn<[string, (any, any) => mixed], mixed> =
  Cfg.handleConfigChange

const showOpenDialog: JestMockFn<
  Array<any>,
  {| canceled: boolean, filePaths: Array<string> |}
> = Electron.dialog.showOpenDialog

const readLabwareDirectory: JestMockFn<
  [string],
  Array<string>
> = (Defs.readLabwareDirectory: any)

const parseLabwareFiles: JestMockFn<
  [Array<string>],
  Array<UncheckedLabwareFile>
> = (Defs.parseLabwareFiles: any)

const validateLabwareFiles: JestMockFn<
  [Array<UncheckedLabwareFile>],
  Array<CheckedLabwareFile>
> = Val.validateLabwareFiles

describe('labware module dispatches', () => {
  const labwareDir = '/path/to/somewhere'
  const mockMainWindow = { browserWindow: true }
  let dispatch
  let handleAction

  beforeEach(() => {
    getFullConfig.mockReturnValue({ labware: { directory: labwareDir } })
    ensureDir.mockResolvedValue()
    readLabwareDirectory.mockResolvedValue([])
    parseLabwareFiles.mockResolvedValue([])
    validateLabwareFiles.mockReturnValue([])

    dispatch = jest.fn()
    handleAction = registerLabware(dispatch, mockMainWindow)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  test('ensures labware directory exists on FETCH_CUSTOM_LABWARE', () => {
    handleAction({
      type: 'labware:FETCH_CUSTOM_LABWARE',
      meta: { shell: true },
    })
    expect(ensureDir).toHaveBeenCalledWith(labwareDir)
  })

  test('reads labware directory on FETCH_CUSTOM_LABWARE', () => {
    handleAction({
      type: 'labware:FETCH_CUSTOM_LABWARE',
      meta: { shell: true },
    })

    return Promise.resolve()
      .then(() => ensureDir.mock.results[0].value)
      .then(() => expect(readLabwareDirectory).toHaveBeenCalledWith(labwareDir))
  })

  test('reads and parses definition files', () => {
    const mockDirectoryListing = ['a.json', 'b.json', 'c.json', 'd.json']
    const mockParsedFiles = [
      { filename: 'a.json', created: 0, data: {} },
      { filename: 'b.json', created: 1, data: {} },
      { filename: 'c.json', created: 2, data: {} },
      { filename: 'd.json', created: 3, data: {} },
    ]

    readLabwareDirectory.mockResolvedValueOnce(mockDirectoryListing)
    parseLabwareFiles.mockResolvedValueOnce(mockParsedFiles)

    handleAction({
      type: 'labware:FETCH_CUSTOM_LABWARE',
      meta: { shell: true },
    })

    return Promise.resolve()
      .then(() => readLabwareDirectory.mock.results[0].value)
      .then(() => parseLabwareFiles.mock.results[0].value)
      .then(() => {
        expect(parseLabwareFiles).toHaveBeenCalledWith(mockDirectoryListing)
        expect(validateLabwareFiles).toHaveBeenCalledWith(mockParsedFiles)
      })
  })

  test('dispatches CUSTOM_LABWARE with labware files', () => {
    const mockValidatedFiles = [
      { type: 'BAD_JSON_LABWARE_FILE', filename: 'd.json', created: 3 },
      { type: 'INVALID_LABWARE_FILE', filename: 'c.json', created: 2 },
      {
        type: 'DUPLICATE_LABWARE_FILE',
        filename: 'b.json',
        created: 1,
        metadata: validLabwareA.metadata,
        identity: {
          name: 'fixture_96_plate',
          version: 1,
          namespace: 'fixture',
        },
      },
      {
        type: 'VALID_LABWARE_FILE',
        filename: 'a.json',
        created: 0,
        metadata: validLabwareA.metadata,
        identity: {
          name: 'fixture_96_plate',
          version: 1,
          namespace: 'fixture',
        },
      },
    ]

    validateLabwareFiles.mockReturnValueOnce(mockValidatedFiles)

    handleAction({
      type: 'labware:FETCH_CUSTOM_LABWARE',
      meta: { shell: true },
    })

    return Promise.resolve()
      .then(() => readLabwareDirectory.mock.results[0].value)
      .then(() => parseLabwareFiles.mock.results[0].value)
      .then(() => {
        expect(dispatch).toHaveBeenCalledWith({
          type: 'labware:CUSTOM_LABWARE',
          payload: mockValidatedFiles,
        })
      })
  })

  test('opens file picker on CHANGE_CUSTOM_LABWARE_DIRECTORY', () => {
    showOpenDialog.mockResolvedValue({ canceled: true, filePaths: [] })

    handleAction({
      type: 'labware:CHANGE_CUSTOM_LABWARE_DIRECTORY',
      meta: { shell: true },
    })

    return Promise.resolve()
      .then(() => showOpenDialog.mock.results[0].value)
      .then(() => {
        expect(showOpenDialog).toHaveBeenCalledWith(mockMainWindow, {
          defaultPath: labwareDir,
          properties: ['openDirectory', 'createDirectory'],
        })
        expect(dispatch).not.toHaveBeenCalled()
      })
  })

  test('dispatches config:UPDATE on labware dir selection', () => {
    showOpenDialog.mockResolvedValue({
      canceled: false,
      filePaths: ['/path/to/labware'],
    })

    handleAction({
      type: 'labware:CHANGE_CUSTOM_LABWARE_DIRECTORY',
      meta: { shell: true },
    })

    return Promise.resolve()
      .then(() => showOpenDialog.mock.results[0].value)
      .then(() => {
        expect(dispatch).toHaveBeenCalledWith({
          type: 'config:UPDATE',
          payload: { path: 'labware.directory', value: '/path/to/labware' },
          meta: { shell: true },
        })
      })
  })

  test('reads labware directory on config change', () => {
    expect(handleConfigChange).toHaveBeenCalledWith(
      'labware.directory',
      expect.any(Function)
    )
    const changeHandler = handleConfigChange.mock.calls[0][1]

    changeHandler()

    return Promise.resolve()
      .then(() => ensureDir.mock.results[0].value)
      .then(() => expect(readLabwareDirectory).toHaveBeenCalledWith(labwareDir))
  })
})
