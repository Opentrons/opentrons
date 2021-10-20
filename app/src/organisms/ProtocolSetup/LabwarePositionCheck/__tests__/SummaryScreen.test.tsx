import * as React from 'react'
import { when } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { SectionList } from '../SectionList'
import { DeckMap } from '../DeckMap'
import { SummaryScreen } from '../SummaryScreen'
import { LabwareOffsetsSummary } from '../LabwareOffsetsSummary'
import { useIntroInfo, useLabwareIdsBySection } from '../hooks'
import { Section } from '../types'

jest.mock('../SectionList')
jest.mock('../hooks')
jest.mock('../DeckMap')
jest.mock('../LabwareOffsetsSummary')

const mockSectionList = SectionList as jest.MockedFunction<typeof SectionList>
const mockUseIntroInfo = useIntroInfo as jest.MockedFunction<
  typeof useIntroInfo
>
const mockUseLabwareIdsBySection = useLabwareIdsBySection as jest.MockedFunction<
  typeof useLabwareIdsBySection
>
const mockDeckmap = DeckMap as jest.MockedFunction<typeof DeckMap>

const mockLabwareOffsetsSummary = LabwareOffsetsSummary as jest.MockedFunction<
  typeof LabwareOffsetsSummary
>

const MOCK_SECTIONS = ['PRIMARY_PIPETTE_TIPRACKS' as Section]

const render = () => {
  return renderWithProviders(<SummaryScreen />, {
    i18nInstance: i18n,
  })[0]
}

describe('SummaryScreen', () => {
  beforeEach(() => {
    mockSectionList.mockReturnValue(<div>Mock SectionList</div>)
    mockDeckmap.mockReturnValue(<div>Mock DeckMap</div>)
    mockLabwareOffsetsSummary.mockReturnValue(
      <div>Mock Labware Offsets Summary </div>
    )
    mockUseLabwareIdsBySection.mockReturnValue({})

    when(mockUseIntroInfo).calledWith().mockReturnValue({
      primaryTipRackSlot: '1',
      primaryTipRackName: 'Opentrons 96 Filter Tip Rack 200 µL',
      primaryPipetteMount: 'left',
      secondaryPipetteMount: '',
      numberOfTips: 1,
      firstStepLabwareSlot: '2',
      sections: MOCK_SECTIONS,
    })
  })
  it('renders Summary Screen with all components and header', () => {
    const { getByText } = render()
    getByText('Mock SectionList')
    getByText('Mock DeckMap')
    getByText('Mock Labware Offsets Summary')
    getByText('Labware Position Check Complete')
  })
  it('renders button and clicks it', () => {
    const { getByRole } = render()
    getByRole('button', { name: 'Close and apply labware offset data' })
  })
})
