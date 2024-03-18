import fse from 'fs-extra'
import electron from 'electron'
import { describe, it, vi, expect, beforeEach, afterEach } from 'vitest'
import * as Cfg from '../../config'
import * as Dialogs from '../../dialogs'
import * as Defs from '../definitions'
import * as Val from '../validation'
import { registerLabware } from '..'

import { uiInitialized } from '@opentrons/app/src/redux/shell/actions'
import * as CustomLabware from '@opentrons/app/src/redux/custom-labware'
import * as CustomLabwareFixtures from '@opentrons/app/src/redux/custom-labware/__fixtures__'

import type { Mock } from 'vitest'
import type { Config } from '@opentrons/app/src/redux/config/types'
import type { Dispatch } from '../../types'

vi.mock('fs-extra')
vi.mock('electron')
vi.mock('../../config')
vi.mock('../../dialogs')
vi.mock('../definitions')
vi.mock('../validation')

// wait a few ticks to let the mock Promises clear
const flush = (): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, 0))

describe('labware module dispatches', () => {
  const labwareDir = '/path/to/somewhere'
  const mockMainWindow = ({
    browserWindow: true,
  } as unknown) as electron.BrowserWindow
  let dispatch: Mock
  let handleAction: Dispatch

  beforeEach(() => {
    vi.mocked(Cfg.getFullConfig).mockReturnValue({
      labware: { directory: labwareDir },
    } as Config)
    vi.mocked(fse.ensureDir).mockResolvedValue(undefined as never)
    vi.mocked(Defs.addLabwareFile).mockResolvedValue()
    vi.mocked(Defs.removeLabwareFile).mockResolvedValue()
    vi.mocked(Defs.readLabwareDirectory).mockResolvedValue([])
    vi.mocked(Defs.parseLabwareFiles).mockResolvedValue([])
    vi.mocked(Val.validateLabwareFiles).mockReturnValue([])

    vi.mocked(Dialogs.showOpenDirectoryDialog).mockResolvedValue([])
    vi.mocked(Dialogs.showOpenFileDialog).mockResolvedValue([])

    dispatch = vi.fn()
    handleAction = registerLabware(dispatch, mockMainWindow)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('ensures labware directory exists on FETCH_CUSTOM_LABWARE', () => {
    handleAction(CustomLabware.fetchCustomLabware())
    expect(vi.mocked(fse.ensureDir)).toHaveBeenCalledWith(labwareDir)
  })

  it('reads labware directory on FETCH_CUSTOM_LABWARE', () => {
    handleAction(CustomLabware.fetchCustomLabware())

    return flush().then(() =>
      expect(vi.mocked(Defs.readLabwareDirectory)).toHaveBeenCalledWith(
        labwareDir
      )
    )
  })

  it('reads labware directory on shell:UI_INITIALIZED', () => {
    handleAction(uiInitialized())

    return flush().then(() =>
      expect(vi.mocked(Defs.readLabwareDirectory)).toHaveBeenCalledWith(
        labwareDir
      )
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

    vi.mocked(Defs.readLabwareDirectory).mockResolvedValueOnce(
      mockDirectoryListing
    )
    vi.mocked(Defs.parseLabwareFiles).mockResolvedValueOnce(mockParsedFiles)

    handleAction(CustomLabware.fetchCustomLabware())

    return flush().then(() => {
      expect(vi.mocked(Defs.parseLabwareFiles)).toHaveBeenCalledWith(
        mockDirectoryListing
      )
      expect(vi.mocked(Val.validateLabwareFiles)).toHaveBeenCalledWith(
        mockParsedFiles
      )
    })
  })

  it('dispatches CUSTOM_LABWARE_LIST with labware files', () => {
    const mockValidatedFiles = [
      CustomLabwareFixtures.mockInvalidLabware,
      CustomLabwareFixtures.mockDuplicateLabware,
      CustomLabwareFixtures.mockValidLabware,
    ]

    vi.mocked(Val.validateLabwareFiles).mockReturnValueOnce(mockValidatedFiles)

    handleAction(CustomLabware.fetchCustomLabware())

    return flush().then(() => {
      expect(dispatch).toHaveBeenCalledWith(
        CustomLabware.customLabwareList(mockValidatedFiles)
      )
    })
  })

  it('dispatches CUSTOM_LABWARE_LIST_FAILURE if read fails', () => {
    vi.mocked(Defs.readLabwareDirectory).mockRejectedValue(new Error('AH'))

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
      expect(vi.mocked(Dialogs.showOpenDirectoryDialog)).toHaveBeenCalledWith(
        mockMainWindow,
        {
          defaultPath: labwareDir,
        }
      )
      expect(dispatch).not.toHaveBeenCalled()
    })
  })

  it('dispatches config:UPDATE on labware dir selection', () => {
    vi.mocked(Dialogs.showOpenDirectoryDialog).mockResolvedValue([
      '/path/to/labware',
    ])

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
    expect(vi.mocked(Cfg.handleConfigChange)).toHaveBeenCalledWith(
      'labware.directory',
      expect.any(Function)
    )
    const changeHandler = vi.mocked(Cfg.handleConfigChange).mock.calls[0][1]

    changeHandler('old', 'new')

    return flush().then(() => {
      expect(vi.mocked(Defs.readLabwareDirectory)).toHaveBeenCalledWith(
        labwareDir
      )
      expect(dispatch).toHaveBeenCalledWith(
        CustomLabware.customLabwareList([], 'changeDirectory')
      )
    })
  })

  it('dispatches labware directory list error on config change', () => {
    const changeHandler = vi.mocked(Cfg.handleConfigChange).mock.calls[0][1]

    vi.mocked(Defs.readLabwareDirectory).mockRejectedValue(new Error('AH'))
    changeHandler('old', 'new')

    return flush().then(() => {
      expect(vi.mocked(Defs.readLabwareDirectory)).toHaveBeenCalledWith(
        labwareDir
      )
      expect(dispatch).toHaveBeenCalledWith(
        CustomLabware.customLabwareListFailure('AH', 'changeDirectory')
      )
    })
  })

  it('opens file picker on ADD_CUSTOM_LABWARE', () => {
    handleAction(CustomLabware.addCustomLabware())

    return flush().then(() => {
      expect(vi.mocked(Dialogs.showOpenFileDialog)).toHaveBeenCalledWith(
        mockMainWindow,
        {
          defaultPath: '__mock-app-path__',
          filters: [
            {
              name: 'JSON Labware Definitions',
              extensions: ['json'],
            },
          ],
          properties: ['multiSelections'],
        }
      )
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

    vi.mocked(Dialogs.showOpenFileDialog).mockResolvedValue([
      '/path/to/labware.json',
    ])
    // validation of existing definitions
    vi.mocked(Val.validateLabwareFiles).mockReturnValueOnce(mockValidatedFiles)
    // existing files mock return
    vi.mocked(Defs.parseLabwareFiles).mockResolvedValue([])
    // new file mock return
    vi.mocked(Defs.parseLabwareFiles).mockResolvedValue([mockNewUncheckedFile])
    // new file (not needed for this test except to prevent a type error)
    vi.mocked(Val.validateNewLabwareFile).mockReturnValueOnce(
      mockValidatedFiles[0]
    )

    handleAction(CustomLabware.addCustomLabware())

    return flush().then(() => {
      expect(vi.mocked(Val.validateNewLabwareFile)).toHaveBeenCalledWith(
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

    vi.mocked(Dialogs.showOpenFileDialog).mockResolvedValue(['c.json'])
    vi.mocked(Val.validateNewLabwareFile).mockReturnValueOnce(mockInvalidFile)

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

    vi.mocked(Dialogs.showOpenFileDialog).mockResolvedValue([
      mockValidFile.filename,
    ])
    vi.mocked(Val.validateNewLabwareFile).mockReturnValueOnce(mockValidFile)

    // initial read
    vi.mocked(Val.validateLabwareFiles).mockReturnValueOnce([])
    // read after add
    vi.mocked(Val.validateLabwareFiles).mockReturnValueOnce([mockValidFile])

    handleAction(CustomLabware.addCustomLabware())

    return flush().then(() => {
      expect(vi.mocked(Defs.addLabwareFile)).toHaveBeenCalledWith(
        mockValidFile.filename,
        labwareDir
      )
      expect(dispatch).toHaveBeenCalledWith(expectedAction)
    })
  })

  it('dispatches ADD_CUSTOM_LABWARE_FAILURE if something rejects', () => {
    const mockValidFile = CustomLabwareFixtures.mockValidLabware
    const expectedAction = CustomLabware.addCustomLabwareFailure(null, 'AH')

    vi.mocked(Dialogs.showOpenFileDialog).mockResolvedValue(['a.json'])
    vi.mocked(Val.validateNewLabwareFile).mockReturnValueOnce(mockValidFile)
    vi.mocked(Val.validateLabwareFiles).mockReturnValueOnce([])
    vi.mocked(Defs.addLabwareFile).mockRejectedValue(new Error('AH'))

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
    vi.mocked(Val.validateLabwareFiles).mockReturnValueOnce(mockExisting)
    // validation after deletes
    vi.mocked(Val.validateLabwareFiles).mockReturnValueOnce(mockAfterDeletes)

    handleAction(CustomLabware.addCustomLabware(duplicate))

    return flush().then(() => {
      expect(vi.mocked(Defs.removeLabwareFile)).toHaveBeenCalledWith(
        '/duplicate1.json'
      )
      expect(vi.mocked(Defs.removeLabwareFile)).toHaveBeenCalledWith(
        '/duplicate2.json'
      )
      expect(vi.mocked(Defs.addLabwareFile)).toHaveBeenCalledWith(
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

    vi.mocked(Val.validateLabwareFiles).mockReturnValueOnce(mockExisting)
    vi.mocked(Defs.removeLabwareFile).mockRejectedValue(new Error('AH'))

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
