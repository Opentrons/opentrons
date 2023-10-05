import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import {
  LoadFixtureRunTimeCommand,
  WASTE_CHUTE_LOAD_NAME,
  WASTE_CHUTE_SLOT,
} from '@opentrons/shared-data'
import { i18n } from '../../../../../i18n'
import { useLoadedFixturesConfigStatus } from '../../../../../resources/deck_configuration/hooks'
import { SetupFixtureList } from '../SetupFixtureList'
import type { LoadedFixturesBySlot } from '@opentrons/api-client'

jest.mock('../../../../../resources/deck_configuration/hooks')

const mockUseLoadedFixturesConfigStatus = useLoadedFixturesConfigStatus as jest.MockedFunction<
  typeof useLoadedFixturesConfigStatus
>

const mockLoadedFixture = {
  id: 'stubbed_load_fixture',
  commandType: 'loadFixture',
  params: {
    fixtureId: 'stubbedFixtureId',
    loadName: WASTE_CHUTE_LOAD_NAME,
    location: { cutout: 'D3' },
  },
  createdAt: 'fakeTimestamp',
  startedAt: 'fakeTimestamp',
  completedAt: 'fakeTimestamp',
  status: 'succeeded',
} as LoadFixtureRunTimeCommand

const mockLoadedFixturesBySlot: LoadedFixturesBySlot = {
  D3: mockLoadedFixture,
}

const render = (props: React.ComponentProps<typeof SetupFixtureList>) => {
  return renderWithProviders(<SetupFixtureList {...props} />, {
    i18nInstance: i18n,
  })
}

describe('SetupFixtureList', () => {
  let props: React.ComponentProps<typeof SetupFixtureList>
  beforeEach(() => {
    props = {
      loadedFixturesBySlot: mockLoadedFixturesBySlot,
    }
    mockUseLoadedFixturesConfigStatus.mockReturnValue([
      {
        ...mockLoadedFixture,
        configurationStatus: 'configured',
      },
    ])
  })

  it('should render the headers and a fixture with configured status', () => {
    const { getByText, getByRole } = render(props)[0]
    getByText('Fixture')
    getByText('Location')
    getByText('Status')
    getByText('Waste Chute')
    getByRole('button', { name: 'View setup instructions' })
    getByText(WASTE_CHUTE_SLOT)
    getByText('Configured')
  })
  it('should render the headers and a fixture with conflicted status', () => {
    mockUseLoadedFixturesConfigStatus.mockReturnValue([
      {
        ...mockLoadedFixture,
        configurationStatus: 'conflicting',
      },
    ])
    const { getByText } = render(props)[0]
    getByText('Conflicting')
  })
  it('should render the headers and a fixture with not configured status and button', () => {
    mockUseLoadedFixturesConfigStatus.mockReturnValue([
      {
        ...mockLoadedFixture,
        configurationStatus: 'not configured',
      },
    ])
    const { getByText, getByRole } = render(props)[0]
    getByText('Not configured')
    getByRole('button', { name: 'Update deck' }).click()
    //  TODO(Jr, 10/5/23): add test coverage for button
  })
})
