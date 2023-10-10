import * as React from 'react'
import { UseQueryResult } from 'react-query'

import { renderWithProviders } from '@opentrons/components'
import { useDeckConfigurationQuery } from '@opentrons/react-api-client'
import {
  STAGING_AREA_LOAD_NAME,
  TRASH_BIN_LOAD_NAME,
  WASTE_CHUTE_LOAD_NAME,
} from '@opentrons/shared-data'

import { i18n } from '../../../i18n'
import { FixtureTable } from '../FixtureTable'

import type { DeckConfiguration, Fixture } from '@opentrons/shared-data'

jest.mock('@opentrons/react-api-client')

const mockFixture = [
  {
    fixtureId: 'mockId',
    fixtureLocation: 'B3',
    loadName: STAGING_AREA_LOAD_NAME,
  },
  {
    fixtureId: 'mockId',
    fixtureLocation: 'A1',
    loadName: TRASH_BIN_LOAD_NAME,
  },
  {
    fixtureId: 'mockId',
    fixtureLocation: 'D3',
    loadName: WASTE_CHUTE_LOAD_NAME,
  },
] as Fixture[]

const mockUseDeckConfigurationQuery = useDeckConfigurationQuery as jest.MockedFunction<
  typeof useDeckConfigurationQuery
>

const render = () => {
  return renderWithProviders(<FixtureTable />, { i18nInstance: i18n })
}

describe('FixtureTable', () => {
  beforeEach(() => {
    mockUseDeckConfigurationQuery.mockReturnValue({
      data: mockFixture,
    } as UseQueryResult<DeckConfiguration>)
  })
  it('should render table header and contents', () => {
    const [{ getByText }] = render()
    getByText('Fixture')
    getByText('Location')
    getByText('Status')
    getByText('Staging Area Slot')
    getByText('B3')
    getByText('Trash Bin')
    getByText('A1')
    getByText('Waste Chute')
    getByText('D3')
  })
})
