import fse from 'fs-extra'
import electron from 'electron'
import * as Cfg from '../../config'
import * as Dialogs from '../../dialogs'
import * as Defs from '../definitions'
import * as Val from '../validation'
import { registerLabware } from '..'

import { uiInitialized } from '@opentrons/app/src/redux/shell/actions'
import * as CustomLabware from '@opentrons/app/src/redux/custom-labware'
import * as CustomLabwareFixtures from '@opentrons/app/src/redux/custom-labware/__fixtures__'

import type { Config } from '@opentrons/app/src/redux/config/types'
import type { Dispatch } from '../../types'

jest.mock('fs-extra')
jest.mock('electron')
jest.mock('../../config')
jest.mock('../../dialogs')
jest.mock('../definitions')
jest.mock('../validation')

const ensureDir = fse.ensureDir as jest.MockedFunction<typeof fse.ensureDir>

const getFullConfig = Cfg.getFullConfig as jest.MockedFunction<
  typeof Cfg.getFullConfig
>

const handleConfigChange = Cfg.handleConfigChange as jest.MockedFunction<
  typeof Cfg.handleConfigChange
>

const showOpenDirectoryDialog = Dialogs.showOpenDirectoryDialog as jest.MockedFunction<
  typeof Dialogs.showOpenDirectoryDialog
>

const showOpenFileDialog = Dialogs.showOpenFileDialog as jest.MockedFunction<
  typeof Dialogs.showOpenFileDialog
>

const readLabwareDirectory = Defs.readLabwareDirectory as jest.MockedFunction<
  typeof Defs.readLabwareDirectory
>

const parseLabwareFiles = Defs.parseLabwareFiles as jest.MockedFunction<
  typeof Defs.parseLabwareFiles
>

const addLabwareFile = Defs.addLabwareFile as jest.MockedFunction<
  typeof Defs.addLabwareFile
>

const removeLabwareFile = Defs.removeLabwareFile as jest.MockedFunction<
  typeof Defs.removeLabwareFile
>

const validateLabwareFiles = Val.validateLabwareFiles as jest.MockedFunction<
  typeof Val.validateLabwareFiles
>

const validateNewLabwareFile = Val.validateNewLabwareFile as jest.MockedFunction<
  typeof Val.validateNewLabwareFile
>

// wait a few ticks to let the mock Promises clear
const flush = (): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, 0))

describe('labware module dispatches', () => {
  const labwareDir = '/path/to/somewhere'
  const mockMainWindow = ({
    browserWindow: true,
  } as unknown) as electron.BrowserWindow
  let dispatch: jest.MockedFunction<Dispatch>
  let handleAction: Dispatch

  beforeEach(() => {
    getFullConfig.mockReturnValue({
      labware: { directory: labwareDir },
    } as Config)
    ensureDir.mockResolvedValue(undefined as never)
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
      { filename: 'a.json', modified: 0, data: {} },
      { filename: 'b.json', modified: 1, data: {} },
      { filename: 'c.json', modified: 2, data: {} },
      { filename: 'd.json', modified: 3, data: {} },
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
    readLabwareDirectory.mockRejectedValue(new Error('AH'))

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

    changeHandler('old', 'new')

    return flush().then(() => {
      expect(readLabwareDirectory).toHaveBeenCalledWith(labwareDir)
      expect(dispatch).toHaveBeenCalledWith(
        CustomLabware.customLabwareList([], 'changeDirectory')
      )
    })
  })

  it('dispatches labware directory list error on config change', () => {
    const changeHandler = handleConfigChange.mock.calls[0][1]

    readLabwareDirectory.mockRejectedValue(new Error('AH'))
    changeHandler('old', 'new')

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
        filters: [
          {
            name: 'JSON Labware Definitions',
            extensions: ['json'],
          },
        ],
        properties: ['multiSelections'],
      })
      expect(dispatch).not.toHaveBeenCalled()
    })
  })

  it('reads labware directory and new file and compares', () => {
    const mockValidatedFiles = [CustomLabwareFixtures.mockInvalidLabware]

    const mockNewUncheckedFile = {
      filename: '/path/to/labware.json',
      modified: 0,
      data: {},
    }

    showOpenFileDialog.mockResolvedValue(['/path/to/labware.json'])
    // validation of existing definitions
    validateLabwareFiles.mockReturnValueOnce(mockValidatedFiles)
    // existing files mock return
    parseLabwareFiles.mockResolvedValue([])
    // new file mock return
    parseLabwareFiles.mockResolvedValue([mockNewUncheckedFile])
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
    addLabwareFile.mockRejectedValue(new Error('AH'))

    handleAction(CustomLabware.addCustomLabware())

    return flush().then(() => {
      expect(dispatch).toHaveBeenCalledWith(expectedAction)
    })
  })

  it('skips file picker on ADD_CUSTOM_LABWARE with overwrite', () => {
    const duplicate = CustomLabwareFixtures.mockDuplicateLabware
    const mockExisting = [
      { ...duplicate, filename: '/duplicate1.json' },
      { ...duplicate, filename: '/duplicate2.json' },
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
      { ...duplicate, filename: '/duplicate1.json' },
      { ...duplicate, filename: '/duplicate2.json' },
    ]
    const expectedAction = CustomLabware.addCustomLabwareFailure(null, 'AH')

    validateLabwareFiles.mockReturnValueOnce(mockExisting)
    removeLabwareFile.mockRejectedValue(new Error('AH'))

    handleAction(CustomLabware.addCustomLabware(duplicate))

    return flush().then(() => {
      expect(dispatch).toHaveBeenCalledWith(expectedAction)
    })
  })

  it('opens custom labware directory on OPEN_CUSTOM_LABWARE_DIRECTORY', () => {
    handleAction(CustomLabware.openCustomLabwareDirectory())

    return flush().then(() => {
      expect(electron.shell.openPath).toHaveBeenCalledWith(labwareDir)
    })
  })
})
