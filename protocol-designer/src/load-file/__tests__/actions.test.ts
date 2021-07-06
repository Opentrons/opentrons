import { createFile } from '../../file-data/selectors/fileCreator'
import { getFileMetadata } from '../../file-data/selectors/fileFields'
import { saveProtocolFile } from '../actions'
import { saveFile as saveFileUtil } from '../utils'
jest.mock('../../file-data/selectors/fileCreator')
jest.mock('../../file-data/selectors/fileFields')
jest.mock('../utils')
const createFileSelectorMock = createFile as jest.MockedFunction<
  typeof createFile
>
const getFileMetadataMock = getFileMetadata as jest.MockedFunction<
  typeof getFileMetadata
>
const saveFileUtilMock = saveFileUtil as jest.MockedFunction<
  typeof saveFileUtil
>
afterEach(() => {
  jest.resetAllMocks()
})
describe('saveProtocolFile thunk', () => {
  it('should dispatch SAVE_PROTOCOL_FILE and then call saveFile util', () => {
    const fakeState = {}
    const mockFileData = {}
    let actionWasDispatched = false
    createFileSelectorMock.mockImplementation(state => {
      expect(state).toBe(fakeState)
      expect(actionWasDispatched).toBe(true)
      return mockFileData as any
    })
    getFileMetadataMock.mockImplementation(state => {
      expect(state).toBe(fakeState)
      expect(actionWasDispatched).toBe(true)
      return {
        protocolName: 'fooFileName',
      }
    })
    saveFileUtilMock.mockImplementation((fileData, fileName) => {
      expect(fileName).toEqual('fooFileName.json')
      expect(fileData).toBe(mockFileData)
    })
    const dispatch: () => any = jest.fn().mockImplementation(action => {
      expect(action).toEqual({
        type: 'SAVE_PROTOCOL_FILE',
      })
      actionWasDispatched = true
    })
    const getState: () => any = jest.fn().mockImplementation(() => {
      // once we call getState, the thunk should already have dispatched the action
      expect(actionWasDispatched).toBe(true)
      return fakeState
    })
    saveProtocolFile()(dispatch, getState)
    expect(dispatch).toHaveBeenCalled()
    expect(createFileSelectorMock).toHaveBeenCalled()
    expect(getFileMetadataMock).toHaveBeenCalled()
    expect(getState).toHaveBeenCalled()
    expect(saveFileUtilMock).toHaveBeenCalled()
  })
})
