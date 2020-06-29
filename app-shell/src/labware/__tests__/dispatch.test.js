// @flow

import type { Config } from '@opentrons/app/src/config/types'
import * as CustomLabware from '@opentrons/app/src/custom-labware'
import * as CustomLabwareFixtures from '@opentrons/app/src/custom-labware/__fixtures__'
import type {
  CheckedLabwareFile,
  DuplicateLabwareFile,
  UncheckedLabwareFile,
} from '@opentrons/app/src/custom-labware/types'
import { uiInitialized } from '@opentrons/app/src/shell/actions'
import electron from 'electron'
import fse from 'fs-extra'

import { registerLabware } from '..'
import * as Cfg from '../../config'
import * as Dialogs from '../../dialogs'
import * as Defs from '../definitions'
import * as Val from '../validation'

jest.mock('fs-extra')
jest.mock('electron')
jest.mock('../../config')
jest.mock('../../dialogs')
jest.mock('../definitions')
jest.mock('../validation')

const ensureDir: JestMockFn<[string], void> = fse.ensureDir

const getFullConfig: JestMockFn<[], $Shape<Config>> = Cfg.getFullConfig

const handleConfigChange: JestMockFn<[string, (any, any) => mixed], mixed> =
  Cfg.handleConfigChange

const showOpenDirectoryDialog: JestMockFn<
  Array<any>,
  Array<string>
> = (Dialogs.showOpenDirectoryDialog: any)

const showOpenFileDialog: JestMockFn<
  Array<any>,
  Array<string>
> = (Dialogs.showOpenFileDialog: any)

const readLabwareDirectory: JestMockFn<
  [string],
  Array<string>
> = (Defs.readLabwareDirectory: any)

const parseLabwareFiles: JestMockFn<
  [Array<string>],
  Array<UncheckedLabwareFile>
> = (Defs.parseLabwareFiles: any)

const addLabwareFile: JestMockFn<
  [string, string],
  void
> = (Defs.addLabwareFile: any)

const removeLabwareFile: JestMockFn<
  [string],
  void
> = (Defs.removeLabwareFile: any)

const validateLabwareFiles: JestMockFn<
  [Array<UncheckedLabwareFile>],
  Array<CheckedLabwareFile>
> = Val.validateLabwareFiles

const validateNewLabwareFile: JestMockFn<
  [Array<CheckedLabwareFile>, UncheckedLabwareFile],
  CheckedLabwareFile
> = Val.validateNewLabwareFile

// wait a few ticks to let the mock Promises clear
const flush = () => new Promise(resolve => setTimeout(resolve, 0))

describe('labware module dispatches', () => {
  const labwareDir = '/path/to/somewhere'
  const mockMainWindow = { browserWindow: true }
  let dispatch
  let handleAction

  beforeEach(() => {
    getFullConfig.mockReturnValue({ labware: { directory: labwareDir } })
    ensureDir.mockResolvedValue()
    addLabwareFile.mockResolvedValue()
    removeLabwareFile.mockResolvedValue()
    readLabwareDirectory.mockResolvedValue([])
    parseLabwareFiles.mockResolvedValue([])
    validateLabwareFiles.mockReturnValue([])

    showOpenDirectoryDialog.mockResolvedValue([])
    showOpenFileDialog.mockResolvedValue([])

    dispatch = jest.fn()
    handleAction = registerLabware(dispatch, mockMainWindow)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('ensures labware directory exists on FETCH_CUSTOM_LABWARE', () => {
    handleAction(CustomLabware.fetchCustomLabware())
    expect(ensureDir).toHaveBeenCalledWith(labwareDir)
  })

  it('reads labware directory on FETCH_CUSTOM_LABWARE', () => {
    handleAction(CustomLabware.fetchCustomLabware())

    return flush().then(() =>
      expect(readLabwareDirectory).toHaveBeenCalledWith(labwareDir)
    )
  })

  it('reads labware directory on shell:UI_INITIALIZED', () => {
    handleAction(uiInitialized())

    return flush().then(() =>
      expect(readLabwareDirectory).toHaveBeenCalledWith(labwareDir)
    )
  })

  it('reads and parses definition files', () => {
    const mockDirectoryListing = ['a.json', 'b.json', 'c.json', 'd.json']
    const mockParsedFiles = [
      { filename: 'a.json', created: 0, data: {} },
      { filename: 'b.json', created: 1, data: {} },
      { filename: 'c.json', created: 2, data: {} },
      { filename: 'd.json', created: 3, data: {} },
    ]

    readLabwareDirectory.mockResolvedValueOnce(mockDirectoryListing)
    parseLabwareFiles.mockResolvedValueOnce(mockParsedFiles)

    handleAction(CustomLabware.fetchCustomLabware())

    return flush().then(() => {
      expect(parseLabwareFiles).toHaveBeenCalledWith(mockDirectoryListing)
      expect(validateLabwareFiles).toHaveBeenCalledWith(mockParsedFiles)
    })
  })

  it('dispatches CUSTOM_LABWARE_LIST with labware files', () => {
    const mockValidatedFiles = [
      CustomLabwareFixtures.mockInvalidLabware,
      CustomLabwareFixtures.mockDuplicateLabware,
      CustomLabwareFixtures.mockValidLabware,
    ]

    validateLabwareFiles.mockReturnValueOnce(mockValidatedFiles)

    handleAction(CustomLabware.fetchCustomLabware())

    return flush().then(() => {
      expect(dispatch).toHaveBeenCalledWith(
        CustomLabware.customLabwareList(mockValidatedFiles)
      )
    })
  })

  it('dispatches CUSTOM_LABWARE_LIST_FAILURE if read fails', () => {
    readLabwareDirectory.mockRejectedValue((new Error('AH'): any))

    handleAction(CustomLabware.fetchCustomLabware())

    return flush().then(() => {
      expect(dispatch).toHaveBeenCalledWith(
        CustomLabware.customLabwareListFailure('AH')
      )
    })
  })

  it('opens file picker on CHANGE_CUSTOM_LABWARE_DIRECTORY', () => {
    handleAction(CustomLabware.changeCustomLabwareDirectory())

    return flush().then(() => {
      expect(showOpenDirectoryDialog).toHaveBeenCalledWith(mockMainWindow, {
        defaultPath: labwareDir,
      })
      expect(dispatch).not.toHaveBeenCalled()
    })
  })

  it('dispatches config:UPDATE on labware dir selection', () => {
    showOpenDirectoryDialog.mockResolvedValue(['/path/to/labware'])

    handleAction(CustomLabware.changeCustomLabwareDirectory())

    return flush().then(() => {
      expect(dispatch).toHaveBeenCalledWith({
        type: 'config:UPDATE_VALUE',
        payload: { path: 'labware.directory', value: '/path/to/labware' },
        meta: { shell: true },
      })
    })
  })

  it('reads labware directory on config change', () => {
    expect(handleConfigChange).toHaveBeenCalledWith(
      'labware.directory',
      expect.any(Function)
    )
    const changeHandler = handleConfigChange.mock.calls[0][1]

    changeHandler()

    return flush().then(() => {
      expect(readLabwareDirectory).toHaveBeenCalledWith(labwareDir)
      expect(dispatch).toHaveBeenCalledWith(
        CustomLabware.customLabwareList([], 'changeDirectory')
      )
    })
  })

  it('dispatches labware directory list error on config change', () => {
    const changeHandler = handleConfigChange.mock.calls[0][1]

    readLabwareDirectory.mockRejectedValue((new Error('AH'): any))
    changeHandler()

    return flush().then(() => {
      expect(readLabwareDirectory).toHaveBeenCalledWith(labwareDir)
      expect(dispatch).toHaveBeenCalledWith(
        CustomLabware.customLabwareListFailure('AH', 'changeDirectory')
      )
    })
  })

  it('opens file picker on ADD_CUSTOM_LABWARE', () => {
    handleAction(CustomLabware.addCustomLabware())

    return flush().then(() => {
      expect(showOpenFileDialog).toHaveBeenCalledWith(mockMainWindow, {
        defaultPath: '__mock-app-path__',
        filters: [{ name: 'JSON Labware Definitions', extensions: ['json'] }],
      })
      expect(dispatch).not.toHaveBeenCalled()
    })
  })

  it('reads labware directory and new file and compares', () => {
    const mockValidatedFiles = [CustomLabwareFixtures.mockInvalidLabware]

    const mockNewUncheckedFile = {
      filename: '/path/to/labware.json',
      created: 0,
      data: {},
    }

    showOpenFileDialog.mockResolvedValue(['/path/to/labware.json'])
    // validation of existing definitions
    validateLabwareFiles.mockReturnValueOnce(mockValidatedFiles)
    // existing files mock return
    parseLabwareFiles.mockResolvedValue([])
    // new file mock return
    parseLabwareFiles.mockReturnValue([mockNewUncheckedFile])
    // new file (not needed for this test except to prevent a type error)
    validateNewLabwareFile.mockReturnValueOnce(mockValidatedFiles[0])

    handleAction(CustomLabware.addCustomLabware())

    return flush().then(() => {
      expect(validateNewLabwareFile).toHaveBeenCalledWith(
        mockValidatedFiles,
        mockNewUncheckedFile
      )
    })
  })

  it('dispatches ADD_CUSTOM_LABWARE_FAILURE if checked file is invalid', () => {
    const mockInvalidFile = CustomLabwareFixtures.mockInvalidLabware
    const expectedAction = CustomLabware.addCustomLabwareFailure(
      mockInvalidFile
    )

    showOpenFileDialog.mockResolvedValue(['c.json'])
    validateNewLabwareFile.mockReturnValueOnce(mockInvalidFile)

    handleAction(CustomLabware.addCustomLabware())

    return flush().then(() => {
      expect(dispatch).toHaveBeenCalledWith(expectedAction)
    })
  })

  it('adds file and triggers a re-scan if valid', () => {
    const mockValidFile = CustomLabwareFixtures.mockValidLabware
    const expectedAction = CustomLabware.customLabwareList(
      [mockValidFile],
      'addLabware'
    )

    showOpenFileDialog.mockResolvedValue([mockValidFile.filename])
    validateNewLabwareFile.mockReturnValueOnce(mockValidFile)

    // initial read
    validateLabwareFiles.mockReturnValueOnce([])
    // read after add
    validateLabwareFiles.mockReturnValueOnce([mockValidFile])

    handleAction(CustomLabware.addCustomLabware())

    return flush().then(() => {
      expect(addLabwareFile).toHaveBeenCalledWith(
        mockValidFile.filename,
        labwareDir
      )
      expect(dispatch).toHaveBeenCalledWith(expectedAction)
    })
  })

  it('dispatches ADD_CUSTOM_LABWARE_FAILURE if something rejects', () => {
    const mockValidFile = CustomLabwareFixtures.mockValidLabware
    const expectedAction = CustomLabware.addCustomLabwareFailure(null, 'AH')

    showOpenFileDialog.mockResolvedValue(['a.json'])
    validateNewLabwareFile.mockReturnValueOnce(mockValidFile)
    validateLabwareFiles.mockReturnValueOnce([])
    addLabwareFile.mockRejectedValue((new Error('AH'): any))

    handleAction(CustomLabware.addCustomLabware())

    return flush().then(() => {
      expect(dispatch).toHaveBeenCalledWith(expectedAction)
    })
  })

  it('skips file picker on ADD_CUSTOM_LABWARE with overwrite', () => {
    const duplicate = CustomLabwareFixtures.mockDuplicateLabware
    const mockExisting = [
      ({ ...duplicate, filename: '/duplicate1.json' }: DuplicateLabwareFile),
      ({ ...duplicate, filename: '/duplicate2.json' }: DuplicateLabwareFile),
    ]
    const mockAfterDeletes = [CustomLabwareFixtures.mockValidLabware]
    const expectedAction = CustomLabware.customLabwareList(
      mockAfterDeletes,
      'overwriteLabware'
    )

    // validation of existing definitions
    validateLabwareFiles.mockReturnValueOnce(mockExisting)
    // validation after deletes
    validateLabwareFiles.mockReturnValueOnce(mockAfterDeletes)

    handleAction(CustomLabware.addCustomLabware(duplicate))

    return flush().then(() => {
      expect(removeLabwareFile).toHaveBeenCalledWith('/duplicate1.json')
      expect(removeLabwareFile).toHaveBeenCalledWith('/duplicate2.json')
      expect(addLabwareFile).toHaveBeenCalledWith(
        duplicate.filename,
        labwareDir
      )
      expect(dispatch).toHaveBeenCalledWith(expectedAction)
    })
  })

  it('sends ADD_CUSTOM_LABWARE_FAILURE if a something rejects', () => {
    const duplicate = CustomLabwareFixtures.mockDuplicateLabware
    const mockExisting = [
      ({ ...duplicate, filename: '/duplicate1.json' }: DuplicateLabwareFile),
      ({ ...duplicate, filename: '/duplicate2.json' }: DuplicateLabwareFile),
    ]
    const expectedAction = CustomLabware.addCustomLabwareFailure(null, 'AH')

    validateLabwareFiles.mockReturnValueOnce(mockExisting)
    removeLabwareFile.mockRejectedValue((new Error('AH'): any))

    handleAction(CustomLabware.addCustomLabware(duplicate))

    return flush().then(() => {
      expect(dispatch).toHaveBeenCalledWith(expectedAction)
    })
  })

  it('opens custom labware directory on OPEN_CUSTOM_LABWARE_DIRECTORY', () => {
    handleAction(CustomLabware.openCustomLabwareDirectory())

    return flush().then(() => {
      expect(electron.shell.openItem).toHaveBeenCalledWith(labwareDir)
    })
  })
})
