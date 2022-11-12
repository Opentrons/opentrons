import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { act } from 'react-dom/test-utils'
import { fireEvent } from '@testing-library/dom'
import { useTrackEvent } from '../../../../redux/analytics'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { useProtocolDetailsForRun } from '../../../Devices/hooks'
import { useLPCSuccessToast } from '../../../ProtocolSetup/hooks'
import { useCurrentRunId } from '../../../ProtocolUpload/hooks'
import { DeprecatedSectionList } from '../DeprecatedSectionList'
import { DeprecatedDeckMap } from '../DeprecatedDeckMap'
import { DeprecatedSummaryScreen } from '../DeprecatedSummaryScreen'
import { DeprecatedLabwareOffsetsSummary } from '../DeprecatedLabwareOffsetsSummary'
import { useIntroInfo, useLabwareOffsets } from '../../deprecatedHooks'
import { DeprecatedSection } from '../types'

jest.mock('../../../../redux/analytics')
jest.mock('../../../ProtocolUpload/hooks')
jest.mock('../../../Devices/hooks')
jest.mock('../../../ProtocolSetup/hooks')
jest.mock('../DeprecatedSectionList')
jest.mock('../../deprecatedHooks')
jest.mock('../DeprecatedDeckMap')
jest.mock('../DeprecatedLabwareOffsetsSummary')

const mockDeprecatedSectionList = DeprecatedSectionList as jest.MockedFunction<
  typeof DeprecatedSectionList
>
const mockUseIntroInfo = useIntroInfo as jest.MockedFunction<
  typeof useIntroInfo
>
const mockUseProtocolDetailsForRun = useProtocolDetailsForRun as jest.MockedFunction<
  typeof useProtocolDetailsForRun
>
const mockDeprecatedDeckmap = DeprecatedDeckMap as jest.MockedFunction<
  typeof DeprecatedDeckMap
>

const mockDeprecatedLabwareOffsetsSummary = DeprecatedLabwareOffsetsSummary as jest.MockedFunction<
  typeof DeprecatedLabwareOffsetsSummary
>
const mockUseLabwareOffsets = useLabwareOffsets as jest.MockedFunction<
  typeof useLabwareOffsets
>
const mockUseLPCSuccessToast = useLPCSuccessToast as jest.MockedFunction<
  typeof useLPCSuccessToast
>
const mockUseCurrentRunId = useCurrentRunId as jest.MockedFunction<
  typeof useCurrentRunId
>
const mockUseTrackEvent = useTrackEvent as jest.MockedFunction<
  typeof useTrackEvent
>

const MOCK_DEPRECATED_SECTIONS = [
  'PRIMARY_PIPETTE_TIPRACKS' as DeprecatedSection,
]
const LABWARE_DEF_ID = 'LABWARE_DEF_ID'
const PRIMARY_PIPETTE_ID = 'PRIMARY_PIPETTE_ID'
const PRIMARY_PIPETTE_NAME = 'PRIMARY_PIPETTE_NAME'
const LABWARE_DEF = {
  ordering: [['A1', 'A2']],
}
const MOCK_RUN_ID = 'fake_run_id'

const render = (
  props: React.ComponentProps<typeof DeprecatedSummaryScreen>
) => {
  return renderWithProviders(<DeprecatedSummaryScreen {...props} />, {
    i18nInstance: i18n,
  })[0]
}

let mockTrackEvent: jest.Mock
describe('DeprecatedSummaryScreen', () => {
  let props: React.ComponentProps<typeof DeprecatedSummaryScreen>

  beforeEach(() => {
    props = {
      savePositionCommandData: { someLabwareIf: ['commandId1', 'commandId2'] },
      onCloseClick: jest.fn(),
    }
    mockUseCurrentRunId.mockReturnValue(MOCK_RUN_ID)
    mockDeprecatedSectionList.mockReturnValue(<div>Mock SectionList</div>)
    mockDeprecatedDeckmap.mockReturnValue(<div>Mock DeckMap</div>)
    mockDeprecatedLabwareOffsetsSummary.mockReturnValue(
      <div>Mock Labware Offsets Summary </div>
    )
    mockUseLabwareOffsets.mockResolvedValue([])

    when(mockUseIntroInfo).calledWith().mockReturnValue({
      primaryPipetteMount: 'left',
      secondaryPipetteMount: '',
      firstTiprackSlot: '2',
      sections: MOCK_DEPRECATED_SECTIONS,
    })

    when(mockUseProtocolDetailsForRun)
      .calledWith(MOCK_RUN_ID)
      .mockReturnValue({
        protocolData: {
          labware: [
            {
              id:
                '1d57fc10-67ad-11ea-9f8b-3b50068bd62d:opentrons/opentrons_96_filtertiprack_200ul/1',
              slot: '1',
              displayName: 'someDisplayName',
              definitionId: LABWARE_DEF_ID,
              loadName: 'someLoadName',
            },
          ],
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
      .mockReturnValue({ setIsShowingLPCSuccessToast: _isShowing => {} })
    mockTrackEvent = jest.fn()
    when(mockUseTrackEvent).calledWith().mockReturnValue(mockTrackEvent)
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
  it('renders apply offset button and clicks it', () => {
    const mockSetIsShowingLPCSuccessToast = jest.fn()
    when(mockUseLPCSuccessToast).calledWith().mockReturnValue({
      setIsShowingLPCSuccessToast: mockSetIsShowingLPCSuccessToast,
    })
    const { getByRole } = render(props)
    expect(props.onCloseClick).not.toHaveBeenCalled()
    expect(mockSetIsShowingLPCSuccessToast).not.toHaveBeenCalled()
    const button = getByRole('button', {
      name: 'Close and apply labware offset data',
    })
    act(() => {
      fireEvent.click(button)
    })
    expect(props.onCloseClick).toHaveBeenCalled()
    expect(mockSetIsShowingLPCSuccessToast).toHaveBeenCalled()
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: 'applyLabwareOffsetData',
      properties: {},
    })
  })
})
