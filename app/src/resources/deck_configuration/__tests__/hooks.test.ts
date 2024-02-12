import { when, resetAllWhenMocks } from 'jest-when'

import { useDeckConfigurationQuery } from '@opentrons/react-api-client'
import {
  SINGLE_LEFT_SLOT_FIXTURE,
  SINGLE_RIGHT_SLOT_FIXTURE,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE,
} from '@opentrons/shared-data'

import type { UseQueryResult } from 'react-query'
import type { DeckConfiguration } from '@opentrons/shared-data'

jest.mock('@opentrons/react-api-client')

const mockUseDeckConfigurationQuery = useDeckConfigurationQuery as jest.MockedFunction<
  typeof useDeckConfigurationQuery
>

const MOCK_DECK_CONFIG: DeckConfiguration = [
  {
    cutoutId: 'cutoutA1',
    cutoutFixtureId: SINGLE_LEFT_SLOT_FIXTURE,
  },
  {
    cutoutId: 'cutoutB1',
    cutoutFixtureId: SINGLE_LEFT_SLOT_FIXTURE,
  },
  {
    cutoutId: 'cutoutC1',
    cutoutFixtureId: SINGLE_LEFT_SLOT_FIXTURE,
  },
  {
    cutoutId: 'cutoutD1',
    cutoutFixtureId: SINGLE_LEFT_SLOT_FIXTURE,
  },
  {
    cutoutId: 'cutoutA3',
    cutoutFixtureId: TRASH_BIN_ADAPTER_FIXTURE,
  },
  {
    cutoutId: 'cutoutB3',
    cutoutFixtureId: SINGLE_RIGHT_SLOT_FIXTURE,
  },
  {
    cutoutId: 'cutoutC3',
    cutoutFixtureId: STAGING_AREA_RIGHT_SLOT_FIXTURE,
  },
  {
    cutoutId: 'cutoutD3',
    cutoutFixtureId: WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE,
  },
]

describe('useDeckConfigurationCompatibility', () => {
  beforeEach(() => {
    when(mockUseDeckConfigurationQuery)
      .calledWith()
      .mockReturnValue({
        data: MOCK_DECK_CONFIG,
      } as UseQueryResult<DeckConfiguration>)
  })
  afterEach(() => resetAllWhenMocks())

  it('returns configured status if fixture is configured at location', () => {})
})
