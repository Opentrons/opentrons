import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import {
  STAGING_AREA_LOAD_NAME,
  WASTE_CHUTE_LOAD_NAME,
} from '@opentrons/shared-data'

import { i18n } from '../../../i18n'
import { useLoadedFixturesConfigStatus } from '../../../resources/deck_configuration/hooks'
import { LocationConflictModal } from '../../Devices/ProtocolRun/SetupModuleAndDeck/LocationConflictModal'
import { FixtureTable } from '../FixtureTable'
import type { LoadFixtureRunTimeCommand } from '@opentrons/shared-data'

jest.mock('../../../resources/deck_configuration/hooks')
jest.mock('../../Devices/ProtocolRun/SetupModuleAndDeck/LocationConflictModal')

const mockUseLoadedFixturesConfigStatus = useLoadedFixturesConfigStatus as jest.MockedFunction<
  typeof useLoadedFixturesConfigStatus
>
const mockLocationConflictModal = LocationConflictModal as jest.MockedFunction<
  typeof LocationConflictModal
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

const mockLoadedStagingAreaFixture = {
  id: 'stubbed_load_fixture_2',
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
} as LoadFixtureRunTimeCommand

const mockSetSetupScreen = jest.fn()
const mockSetFixtureLocation = jest.fn()
const mockSetProvidedFixtureOptions = jest.fn()

const render = (props: React.ComponentProps<typeof FixtureTable>) => {
  return renderWithProviders(<FixtureTable {...props} />, {
    i18nInstance: i18n,
  })
}

describe('FixtureTable', () => {
  let props: React.ComponentProps<typeof FixtureTable>
  beforeEach(() => {
    props = {
      mostRecentAnalysis: [] as any,
      setSetupScreen: mockSetSetupScreen,
      setFixtureLocation: mockSetFixtureLocation,
      setProvidedFixtureOptions: mockSetProvidedFixtureOptions,
    }
    mockUseLoadedFixturesConfigStatus.mockReturnValue([
      { ...mockLoadedFixture, configurationStatus: 'configured' },
    ])
    mockLocationConflictModal.mockReturnValue(
      <div>mock location conflict modal</div>
    )
  })

  it('should render table header and contents', () => {
    const [{ getByText }] = render(props)
    getByText('Fixture')
    getByText('Location')
    getByText('Status')
  })
  it('should render the current status - configured', () => {
    props = {
      ...props,
      mostRecentAnalysis: { commands: [mockLoadedFixture] } as any,
    }
    const [{ getByText }] = render(props)
    getByText('Configured')
  })
  it('should render the current status - not configured', () => {
    mockUseLoadedFixturesConfigStatus.mockReturnValue([
      { ...mockLoadedFixture, configurationStatus: 'not configured' },
    ])
    props = {
      ...props,
      mostRecentAnalysis: { commands: [mockLoadedStagingAreaFixture] } as any,
    }
    const [{ getByText }] = render(props)
    getByText('Not configured')
  })
  it('should render the current status - conflicting', () => {
    mockUseLoadedFixturesConfigStatus.mockReturnValue([
      { ...mockLoadedFixture, configurationStatus: 'conflicting' },
    ])
    props = {
      ...props,
      mostRecentAnalysis: { commands: [mockLoadedStagingAreaFixture] } as any,
    }
    const [{ getByText, getAllByText }] = render(props)
    getByText('Location conflict').click()
    getAllByText('mock location conflict modal')
  })
  it('should call a mock function when tapping not configured row', () => {
    mockUseLoadedFixturesConfigStatus.mockReturnValue([
      { ...mockLoadedFixture, configurationStatus: 'not configured' },
    ])
    props = {
      ...props,
      mostRecentAnalysis: { commands: [mockLoadedStagingAreaFixture] } as any,
    }
    const [{ getByText }] = render(props)
    getByText('Not configured').click()
    expect(mockSetFixtureLocation).toHaveBeenCalledWith('cutoutD3')
    expect(mockSetSetupScreen).toHaveBeenCalledWith('deck configuration')
    expect(mockSetProvidedFixtureOptions).toHaveBeenCalledWith(['wasteChute'])
  })
})
