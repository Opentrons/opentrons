import fse from 'fs-extra'
import electron from 'electron'
import * as Config from '@opentrons/app/src/redux/config'
import * as Dialogs from '../../dialogs'
import { registerConfig } from '..'

import type { Dispatch } from '../../types'

jest.mock('fs-extra')
jest.mock('electron')
jest.mock('../../dialogs')

const ensureDir = fse.ensureDir as jest.MockedFunction<typeof fse.ensureDir>

const showOpenDirectoryDialog = Dialogs.showOpenDirectoryDialog as jest.MockedFunction<
  typeof Dialogs.showOpenDirectoryDialog
>

// wait a few ticks to let the mock Promises clear
const flush = (): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, 0))

describe('config module dispatches', () => {
  const mockMainWindow = ({
    browserWindow: true,
  } as unknown) as electron.BrowserWindow
  let dispatch: jest.MockedFunction<Dispatch>
  let handleAction: Dispatch

  beforeEach(() => {
    ensureDir.mockResolvedValue(undefined as never)
    showOpenDirectoryDialog.mockResolvedValue([])

    dispatch = jest.fn()
    handleAction = registerConfig(dispatch, mockMainWindow)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it.skip('opens file picker on UPDATE_CONFIG when path is python.pathToPythonOverride', () => {
    handleAction(Config.updateConfigValue('python.pathToPythonOverride', null))

    return flush().then(() => {
      expect(showOpenDirectoryDialog).toHaveBeenCalled()
      expect(dispatch).not.toHaveBeenCalled()
    })
  })
})
