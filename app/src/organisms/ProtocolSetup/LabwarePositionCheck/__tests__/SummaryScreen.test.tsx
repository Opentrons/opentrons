import * as React from 'react'
import { when } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { useProtocolDetails } from '../../../RunDetails/hooks'
import { SectionList } from '../SectionList'
import { DeckMap } from '../DeckMap'
import { SummaryScreen } from '../SummaryScreen'
import { LabwareOffsetsSummary } from '../LabwareOffsetsSummary'
import { useIntroInfo } from '../hooks'
import { Section } from '../types'

jest.mock('../SectionList')
jest.mock('../hooks')
jest.mock('../DeckMap')
jest.mock('../../../RunDetails/hooks')
jest.mock('../LabwareOffsetsSummary')

const mockSectionList = SectionList as jest.MockedFunction<typeof SectionList>
const mockUseIntroInfo = useIntroInfo as jest.MockedFunction<
  typeof useIntroInfo
>
const mockUseProtocolDetails = useProtocolDetails as jest.MockedFunction<
  typeof useProtocolDetails
>

const mockDeckmap = DeckMap as jest.MockedFunction<typeof DeckMap>

const mockLabwareOffsetsSummary = LabwareOffsetsSummary as jest.MockedFunction<
  typeof LabwareOffsetsSummary
>

const MOCK_SECTIONS = ['PRIMARY_PIPETTE_TIPRACKS' as Section]
const LABWARE_DEF_ID = 'LABWARE_DEF_ID'
const PRIMARY_PIPETTE_ID = 'PRIMARY_PIPETTE_ID'
const PRIMARY_PIPETTE_NAME = 'PRIMARY_PIPETTE_NAME'
const LABWARE_DEF = {
  ordering: [['A1', 'A2']],
}

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

    when(mockUseIntroInfo).calledWith().mockReturnValue({
      primaryTipRackSlot: '1',
      primaryTipRackName: 'Opentrons 96 Filter Tip Rack 200 µL',
      primaryPipetteMount: 'left',
      secondaryPipetteMount: '',
      numberOfTips: 1,
      firstStepLabwareSlot: '2',
      sections: MOCK_SECTIONS,
    })

    when(mockUseProtocolDetails)
      .calledWith()
      .mockReturnValue({
        protocolData: {
          labware: {
            '1d57fc10-67ad-11ea-9f8b-3b50068bd62d:opentrons/opentrons_96_filtertiprack_200ul/1': {
              slot: '1',
              displayName: 'someDislpayName',
              definitionId: LABWARE_DEF_ID,
            },
          },
          labwareDefinitions: {
            [LABWARE_DEF_ID]: LABWARE_DEF,
          },
          pipettes: {
            [PRIMARY_PIPETTE_ID]: {
              name: PRIMARY_PIPETTE_NAME,
              mount: 'left',
            },
          },
        },
      } as any)
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
