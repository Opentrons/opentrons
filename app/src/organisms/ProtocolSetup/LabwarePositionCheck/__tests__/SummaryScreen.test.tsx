import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { act } from 'react-dom/test-utils'
import { fireEvent } from '@testing-library/dom'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { useProtocolDetails } from '../../../RunDetails/hooks'
import { SectionList } from '../SectionList'
import { DeckMap } from '../DeckMap'
import { SummaryScreen } from '../SummaryScreen'
import { LabwareOffsetsSummary } from '../LabwareOffsetsSummary'
import { useIntroInfo, useLabwareOffsets } from '../hooks'
import { Section } from '../types'
import { useLPCSuccessToast } from '../../hooks'

jest.mock('../../../RunDetails/hooks')
jest.mock('../../hooks')
jest.mock('../SectionList')
jest.mock('../hooks')
jest.mock('../DeckMap')
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
const mockUseLabwareOffsets = useLabwareOffsets as jest.MockedFunction<
  typeof useLabwareOffsets
>
const mockUseLPCSuccessToast = useLPCSuccessToast as jest.MockedFunction<
  typeof useLPCSuccessToast
>

const MOCK_SECTIONS = ['PRIMARY_PIPETTE_TIPRACKS' as Section]
const LABWARE_DEF_ID = 'LABWARE_DEF_ID'
const PRIMARY_PIPETTE_ID = 'PRIMARY_PIPETTE_ID'
const PRIMARY_PIPETTE_NAME = 'PRIMARY_PIPETTE_NAME'
const LABWARE_DEF = {
  ordering: [['A1', 'A2']],
}
const MOCK_LABWARE_OFFSETS = {
  labwareId: 'id',
  labwareOffsetLocation: { slotName: 'slot' },
  labwareDefinitionUri: 'uri',
  displayLocation: 'location',
  displayName: 'name',
  vestor: { x: 0, y: 0, z: 0 },
} as any

const render = (props: React.ComponentProps<typeof SummaryScreen>) => {
  return renderWithProviders(<SummaryScreen {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('SummaryScreen', () => {
  let props: React.ComponentProps<typeof SummaryScreen>

  beforeEach(() => {
    props = {
      savePositionCommandData: { someLabwareIf: ['commandId1', 'commandId2'] },
      onCloseClick: jest.fn(),
      applyLabwareOffsets: jest.fn(),
      setLabwareOffsets: jest.fn(),
      labwareOffsets: MOCK_LABWARE_OFFSETS,
    }
    mockSectionList.mockReturnValue(<div>Mock SectionList</div>)
    mockDeckmap.mockReturnValue(<div>Mock DeckMap</div>)
    mockLabwareOffsetsSummary.mockReturnValue(
      <div>Mock Labware Offsets Summary </div>
    )
    mockUseLabwareOffsets.mockResolvedValue([])

    when(mockUseIntroInfo).calledWith().mockReturnValue({
      primaryPipetteMount: 'left',
      secondaryPipetteMount: '',
      firstTiprackSlot: '2',
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
    when(mockUseLPCSuccessToast)
      .calledWith()
      .mockReturnValue({ setShowLPCSuccessToast: () => null })
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.restoreAllMocks()
  })
  it('renders Summary Screen with all components and header', () => {
    const { getByText } = render(props)
    getByText('Mock SectionList')
    getByText('Mock DeckMap')
    getByText('Mock Labware Offsets Summary')
    getByText('Labware Position Check Complete')
  })
  it('renders apply offset button and clicks it and applies labwareOffsets, renders success toast, and closes modal', () => {
    const mockSetShowLPCSuccessToast = jest.fn()
    when(mockUseLPCSuccessToast)
      .calledWith()
      .mockReturnValue({ setShowLPCSuccessToast: mockSetShowLPCSuccessToast })
    const { getByRole } = render(props)
    expect(props.onCloseClick).not.toHaveBeenCalled()
    expect(mockSetShowLPCSuccessToast).not.toHaveBeenCalled()
    const button = getByRole('button', {
      name: 'Close and apply labware offset data',
    })
    act(() => {
      fireEvent.click(button)
    })
    expect(props.onCloseClick).toHaveBeenCalled()
    expect(mockSetShowLPCSuccessToast).toHaveBeenCalled()
    expect(props.applyLabwareOffsets).toHaveBeenCalled()
  })
})
