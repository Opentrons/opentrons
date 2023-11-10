import { when, resetAllWhenMocks } from 'jest-when'
import { v4 as uuidv4 } from 'uuid'

import { useDeckConfigurationQuery } from '@opentrons/react-api-client'
import {
  STAGING_AREA_LOAD_NAME,
  STANDARD_SLOT_LOAD_NAME,
  TRASH_BIN_LOAD_NAME,
  WASTE_CHUTE_LOAD_NAME,
} from '@opentrons/shared-data'

import {
  CONFIGURED,
  CONFLICTING,
  NOT_CONFIGURED,
  useLoadedFixturesConfigStatus,
} from '../hooks'

import type { UseQueryResult } from 'react-query'
import type {
  DeckConfiguration,
  LoadFixtureRunTimeCommand,
} from '@opentrons/shared-data'

jest.mock('@opentrons/react-api-client')

const mockUseDeckConfigurationQuery = useDeckConfigurationQuery as jest.MockedFunction<
  typeof useDeckConfigurationQuery
>

const MOCK_DECK_CONFIG: DeckConfiguration = [
  {
    fixtureLocation: 'cutoutA1',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'cutoutB1',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'cutoutC1',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'cutoutD1',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'cutoutA3',
    loadName: TRASH_BIN_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'cutoutB3',
    loadName: STANDARD_SLOT_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'cutoutC3',
    loadName: STAGING_AREA_LOAD_NAME,
    fixtureId: uuidv4(),
  },
  {
    fixtureLocation: 'cutoutD3',
    loadName: WASTE_CHUTE_LOAD_NAME,
    fixtureId: uuidv4(),
  },
]

const WASTE_CHUTE_LOADED_FIXTURE: LoadFixtureRunTimeCommand = {
  id: 'stubbed_load_fixture',
  commandType: 'loadFixture',
  params: {
    fixtureId: 'stubbedFixtureId',
    loadName: WASTE_CHUTE_LOAD_NAME,
    location: { cutout: 'cutoutD3' },
  },
  createdAt: 'fakeTimestamp',
  startedAt: 'fakeTimestamp',
  completedAt: 'fakeTimestamp',
  status: 'succeeded',
}

const STAGING_AREA_LOADED_FIXTURE: LoadFixtureRunTimeCommand = {
  id: 'stubbed_load_fixture',
  commandType: 'loadFixture',
  params: {
    fixtureId: 'stubbedFixtureId',
    loadName: STAGING_AREA_LOAD_NAME,
    location: { cutout: 'cutoutD3' },
  },
  createdAt: 'fakeTimestamp',
  startedAt: 'fakeTimestamp',
  completedAt: 'fakeTimestamp',
  status: 'succeeded',
}

describe('useLoadedFixturesConfigStatus', () => {
  beforeEach(() => {
    when(mockUseDeckConfigurationQuery)
      .calledWith()
      .mockReturnValue({
        data: MOCK_DECK_CONFIG,
      } as UseQueryResult<DeckConfiguration>)
  })
  afterEach(() => resetAllWhenMocks())

  it('returns configured status if fixture is configured at location', () => {
    const loadedFixturesConfigStatus = useLoadedFixturesConfigStatus([
      WASTE_CHUTE_LOADED_FIXTURE,
    ])
    expect(loadedFixturesConfigStatus).toEqual([
      { ...WASTE_CHUTE_LOADED_FIXTURE, configurationStatus: CONFIGURED },
    ])
  })
  it('returns conflicted status if fixture is conflicted at location', () => {
    const loadedFixturesConfigStatus = useLoadedFixturesConfigStatus([
      STAGING_AREA_LOADED_FIXTURE,
    ])
    expect(loadedFixturesConfigStatus).toEqual([
      { ...STAGING_AREA_LOADED_FIXTURE, configurationStatus: CONFLICTING },
    ])
  })
  it('returns not configured status if fixture is not configured at location', () => {
    when(mockUseDeckConfigurationQuery)
      .calledWith()
      .mockReturnValue({
        data: MOCK_DECK_CONFIG.slice(0, -1),
      } as UseQueryResult<DeckConfiguration>)

    const loadedFixturesConfigStatus = useLoadedFixturesConfigStatus([
      WASTE_CHUTE_LOADED_FIXTURE,
    ])
    expect(loadedFixturesConfigStatus).toEqual([
      { ...WASTE_CHUTE_LOADED_FIXTURE, configurationStatus: NOT_CONFIGURED },
    ])
  })
})
