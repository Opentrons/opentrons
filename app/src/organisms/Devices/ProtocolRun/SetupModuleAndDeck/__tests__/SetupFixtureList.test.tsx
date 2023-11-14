import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import {
  LoadFixtureRunTimeCommand,
  WASTE_CHUTE_LOAD_NAME,
  WASTE_CHUTE_CUTOUT,
} from '@opentrons/shared-data'
import { i18n } from '../../../../../i18n'
import { useLoadedFixturesConfigStatus } from '../../../../../resources/deck_configuration/hooks'
import { SetupFixtureList } from '../SetupFixtureList'
import { NotConfiguredModal } from '../NotConfiguredModal'
import { LocationConflictModal } from '../LocationConflictModal'
import type { LoadedFixturesBySlot } from '@opentrons/api-client'

jest.mock('../../../../../resources/deck_configuration/hooks')
jest.mock('../LocationConflictModal')
jest.mock('../NotConfiguredModal')

const mockUseLoadedFixturesConfigStatus = useLoadedFixturesConfigStatus as jest.MockedFunction<
  typeof useLoadedFixturesConfigStatus
>
const mockLocationConflictModal = LocationConflictModal as jest.MockedFunction<
  typeof LocationConflictModal
>
const mockNotConfiguredModal = NotConfiguredModal as jest.MockedFunction<
  typeof NotConfiguredModal
>
const mockLoadedFixture = {
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
    mockLocationConflictModal.mockReturnValue(
      <div>mock location conflict modal</div>
    )
    mockNotConfiguredModal.mockReturnValue(<div>mock not configured modal</div>)
  })

  it('should render the headers and a fixture with configured status', () => {
    const { getByText, getByRole } = render(props)[0]
    getByText('Fixture')
    getByText('Location')
    getByText('Status')
    getByText('Waste Chute')
    getByRole('button', { name: 'View setup instructions' })
    getByText(WASTE_CHUTE_CUTOUT)
    getByText('Configured')
  })
  it('should render the headers and a fixture with conflicted status', () => {
    mockUseLoadedFixturesConfigStatus.mockReturnValue([
      {
        ...mockLoadedFixture,
        configurationStatus: 'conflicting',
      },
    ])
    const { getByText, getByRole } = render(props)[0]
    getByText('Location conflict')
    getByRole('button', { name: 'Update deck' }).click()
    getByText('mock location conflict modal')
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
    getByText('mock not configured modal')
  })
})
