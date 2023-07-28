import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import fixture_96_plate from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'
import fixture_tiprack_10_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_10_ul.json'
import { LabwareDefinition2 } from '@opentrons/shared-data'
import { getLabwareDefsByURI } from '../../labware-defs/selectors'
import { getInitialDeckSetup } from '../../step-forms/selectors'
import { getLabwareNicknamesById } from '../../ui/labware/selectors'
import { uuid } from '../../utils'
import { getRobotType } from '../../file-data/selectors'
import { renameLabware, createContainer } from '../actions'
import { getNextAvailableDeckSlot, getNextNickname } from '../utils'

jest.mock('../../labware-defs/selectors')
jest.mock('../../step-forms/selectors')
jest.mock('../../ui/labware/selectors')
jest.mock('../../file-data/selectors')
jest.mock('../../utils')
jest.mock('../utils')

const mockGetLabwareDefsByURI = getLabwareDefsByURI as jest.MockedFunction<
  typeof getLabwareDefsByURI
>

const mockGetLabwareNicknamesById = getLabwareNicknamesById as jest.MockedFunction<
  typeof getLabwareNicknamesById
>

const mockUuid = uuid as jest.MockedFunction<typeof uuid>

const mockGetInitialDeckSetup = getInitialDeckSetup as jest.MockedFunction<
  typeof getInitialDeckSetup
>

const mockGetNextAvailableDeckSlot = getNextAvailableDeckSlot as jest.MockedFunction<
  typeof getNextAvailableDeckSlot
>

const mockGetNextNickname = getNextNickname as jest.MockedFunction<
  typeof getNextNickname
>

const mockGetRobotType = getRobotType as jest.MockedFunction<
  typeof getRobotType
>

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

afterEach(() => {
  jest.resetAllMocks()
})

describe('renameLabware thunk', () => {
  it('should dispatch RENAME_LABWARE with a nickname from getNextNickname if `name` arg is unspecified', () => {
    const store: any = mockStore({})

    mockGetLabwareNicknamesById.mockImplementation(state => {
      expect(state).toBe(store.getState())
      return { someLabwareId: 'Some Labware', otherLabwareId: 'Other Labware' }
    })

    mockGetNextNickname.mockImplementation((allNicknames, proposedNickname) => {
      expect(allNicknames).not.toContain('Some Labware')
      expect(allNicknames).toContain('Other Labware')
      expect(proposedNickname).toEqual('Some Labware')
      return 'Mock Next Nickname'
    })

    const expectedActions = [
      {
        type: 'RENAME_LABWARE',
        payload: { labwareId: 'someLabwareId', name: 'Mock Next Nickname' },
      },
    ]
    store.dispatch(renameLabware({ labwareId: 'someLabwareId' }))
    expect(store.getActions()).toEqual(expectedActions)
  })

  it('should dispatch RENAME_LABWARE with a nickname from getNextNickname, with the nickname specified in the `name` arg', () => {
    const store: any = mockStore({})

    mockGetLabwareNicknamesById.mockImplementation(state => {
      expect(state).toBe(store.getState())
      return { someLabwareId: 'Some Labware', otherLabwareId: 'Other Labware' }
    })

    mockGetNextNickname.mockImplementation((allNicknames, proposedNickname) => {
      expect(allNicknames).not.toContain('Some Labware')
      expect(allNicknames).toContain('Other Labware')

      expect(proposedNickname).toEqual('Specified Name')
      // In real life, 'Mock Next Nickname' might be "Some Labware (2)" -- but that
      // is up to the implementation of getNextNickname.
      return 'Mock Next Nickname'
    })

    const expectedActions = [
      {
        type: 'RENAME_LABWARE',
        payload: { labwareId: 'someLabwareId', name: 'Mock Next Nickname' },
      },
    ]

    store.dispatch(
      renameLabware({ labwareId: 'someLabwareId', name: 'Specified Name' })
    )
    expect(store.getActions()).toEqual(expectedActions)
  })
})

describe('createContainer', () => {
  it('should dispatch CREATE_CONTAINER with the specified slot', () => {
    const store: any = mockStore({})
    mockGetRobotType.mockReturnValue('OT-2 Standard')
    mockGetInitialDeckSetup.mockImplementation(state => {
      expect(state).toBe(store.getState())
      return { labware: {}, pipettes: {}, modules: {} }
    })

    mockGetLabwareDefsByURI.mockImplementation(state => {
      expect(state).toBe(store.getState())
      return { someLabwareDefURI: fixture_96_plate as LabwareDefinition2 }
    })

    mockUuid.mockImplementation(() => 'fakeUuid')

    const expectedActions = [
      {
        type: 'CREATE_CONTAINER',
        payload: {
          id: 'fakeUuid:someLabwareDefURI',
          labwareDefURI: 'someLabwareDefURI',
          slot: '4',
        },
      },
    ]

    store.dispatch(
      createContainer({ labwareDefURI: 'someLabwareDefURI', slot: '4' })
    )
    expect(store.getActions()).toEqual(expectedActions)
  })

  it('should dispatch CREATE_CONTAINER with slot from getNextAvailableDeckSlot if no slot is specified', () => {
    const store: any = mockStore({})
    mockGetRobotType.mockReturnValue('OT-2 Standard')
    const initialDeckSetup = { labware: {}, pipettes: {}, modules: {} }
    mockGetInitialDeckSetup.mockImplementation(state => {
      expect(state).toBe(store.getState())
      return initialDeckSetup
    })

    mockGetLabwareDefsByURI.mockImplementation(state => {
      expect(state).toBe(store.getState())
      return { someLabwareDefURI: fixture_96_plate as LabwareDefinition2 }
    })

    mockUuid.mockImplementation(() => 'fakeUuid')

    mockGetNextAvailableDeckSlot.mockImplementation(_initialDeckSetup => {
      expect(_initialDeckSetup).toBe(initialDeckSetup)
      return '3'
    })

    const expectedActions = [
      {
        type: 'CREATE_CONTAINER',
        payload: {
          id: 'fakeUuid:someLabwareDefURI',
          labwareDefURI: 'someLabwareDefURI',
          slot: '3',
        },
      },
    ]

    store.dispatch(createContainer({ labwareDefURI: 'someLabwareDefURI' }))
    expect(store.getActions()).toEqual(expectedActions)
  })

  it('should do nothing if no slot is specified and getNextAvailableDeckSlot returns falsey', () => {
    const store: any = mockStore({})
    mockGetRobotType.mockReturnValue('OT-3 Standard')
    const initialDeckSetup = { labware: {}, pipettes: {}, modules: {} }
    mockGetInitialDeckSetup.mockImplementation(state => {
      expect(state).toBe(store.getState())
      return initialDeckSetup
    })

    mockGetLabwareDefsByURI.mockImplementation(state => {
      expect(state).toBe(store.getState())
      return { someLabwareDefURI: fixture_96_plate as LabwareDefinition2 }
    })

    mockGetNextAvailableDeckSlot.mockImplementation(_initialDeckSetup => {
      expect(_initialDeckSetup).toBe(initialDeckSetup)
      // IRL this would mean that the deck is full, no slots available
      return null
    })

    const expectedActions: any[] = []

    store.dispatch(createContainer({ labwareDefURI: 'someLabwareDefURI' }))
    expect(store.getActions()).toEqual(expectedActions)
  })

  it('should dispatch CREATE_CONTAINER and then RENAME_LABWARE if the labware is a tiprack', () => {
    // NOTE: this is because we don't show the NameThisLabwareOverlay for tipracks,
    // so for the auto-incrementing My Tiprack (1), My Tiprack (2) mechanism to work
    // we must dispatch RENAME_LABWARE here instead of having that overlay dispatch it.
    const store: any = mockStore({})
    mockGetRobotType.mockReturnValue('OT-2 Standard')
    mockGetLabwareNicknamesById.mockImplementation(state => {
      expect(state).toBe(store.getState())
      return {
        'fakeUuid:someLabwareDefURI': 'Some Labware',
        otherLabwareId: 'Other Labware',
      }
    })

    mockGetNextNickname.mockImplementation((allNicknames, proposedNickname) => {
      expect(allNicknames).not.toContain('Some Labware')
      expect(allNicknames).toContain('Other Labware')

      expect(proposedNickname).toEqual('Some Labware')
      // In real life, 'Mock Next Nickname' might be "Some Labware (2)" -- but that
      // is up to the implementation of getNextNickname.
      return 'Mock Next Nickname'
    })

    mockGetInitialDeckSetup.mockImplementation(state => {
      expect(state).toBe(store.getState())
      return { labware: {}, pipettes: {}, modules: {} }
    })

    mockGetLabwareDefsByURI.mockImplementation(state => {
      expect(state).toBe(store.getState())
      return { someLabwareDefURI: fixture_tiprack_10_ul as LabwareDefinition2 }
    })

    mockUuid.mockImplementation(() => 'fakeUuid')

    const expectedActions = [
      {
        type: 'CREATE_CONTAINER',
        payload: {
          id: 'fakeUuid:someLabwareDefURI',
          labwareDefURI: 'someLabwareDefURI',
          slot: '4',
        },
      },
      {
        type: 'RENAME_LABWARE',
        payload: {
          labwareId: 'fakeUuid:someLabwareDefURI',
          name: 'Mock Next Nickname',
        },
      },
    ]

    store.dispatch(
      createContainer({ labwareDefURI: 'someLabwareDefURI', slot: '4' })
    )
    expect(store.getActions()).toEqual(expectedActions)
  })
})
