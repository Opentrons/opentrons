import * as React from 'react'
import { when } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'
import {
  STAGING_AREA_LOAD_NAME,
  WASTE_CHUTE_LOAD_NAME,
} from '@opentrons/shared-data'

import { i18n } from '../../../i18n'
import { useLoadedFixturesConfigStatus } from '../../../resources/deck_configuration/hooks'
import { useFeatureFlag } from '../../../redux/config'
import { FixtureTable } from '../FixtureTable'
import type { LoadFixtureRunTimeCommand } from '@opentrons/shared-data'

jest.mock('../../../redux/config')
jest.mock('../../../resources/deck_configuration/hooks')

const mockUseFeatureFlag = useFeatureFlag as jest.MockedFunction<
  typeof useFeatureFlag
>
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

const mockLoadedStagingAreaFixture = {
  id: 'stubbed_load_fixture_2',
  commandType: 'loadFixture',
  params: {
    fixtureId: 'stubbedFixtureId',
    loadName: STAGING_AREA_LOAD_NAME,
    location: { cutout: 'D3' },
  },
  createdAt: 'fakeTimestamp',
  startedAt: 'fakeTimestamp',
  completedAt: 'fakeTimestamp',
  status: 'succeeded',
} as LoadFixtureRunTimeCommand

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
    }
    when(mockUseFeatureFlag)
      .calledWith('enableDeckConfiguration')
      .mockReturnValue(true)
    mockUseLoadedFixturesConfigStatus.mockReturnValue([
      { ...mockLoadedFixture, configurationStatus: 'configured' },
    ])
  })

  it('should render table header and contents', () => {
    const [{ getByText }] = render(props)
    getByText('Fixture')
    getByText('Location')
    getByText('Status')
  })
  it('should render the current status - configured', () => {
    props = {
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
      mostRecentAnalysis: { commands: [mockLoadedStagingAreaFixture] } as any,
    }
    const [{ getByText }] = render(props)
    getByText('Not configured')
  })
  it('should render the current status - not configured', () => {
    mockUseLoadedFixturesConfigStatus.mockReturnValue([
      { ...mockLoadedFixture, configurationStatus: 'conflicting' },
    ])
    props = {
      mostRecentAnalysis: { commands: [mockLoadedStagingAreaFixture] } as any,
    }
    const [{ getByText }] = render(props)
    getByText('Location conflict')
  })
})
