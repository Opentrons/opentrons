import * as React from 'react'
import { when } from 'jest-when'
import {
  partialComponentPropsMatcher,
  renderWithProviders,
} from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { DeprecatedGenericStepScreen } from '../DeprecatedGenericStepScreen'
import { DeprecatedLabwarePositionCheckStepDetail } from '../DeprecatedLabwarePositionCheckStepDetail'
import { DeprecatedSectionList } from '../DeprecatedSectionList'
import { DeprecatedDeckMap } from '../DeprecatedDeckMap'
import {
  useIntroInfo,
  useLabwareIdsBySection,
  useDeprecatedSteps,
} from '../../deprecatedHooks'
import { DeprecatedSection } from '../types'

jest.mock('../DeprecatedLabwarePositionCheckStepDetail')
jest.mock('../DeprecatedSectionList')
jest.mock('../DeprecatedDeckMap')
jest.mock('../../deprecatedHooks')

const mockDeprecatedLabwarePositionCheckStepDetail = DeprecatedLabwarePositionCheckStepDetail as jest.MockedFunction<
  typeof DeprecatedLabwarePositionCheckStepDetail
>
const mockDeprecatedSectionList = DeprecatedSectionList as jest.MockedFunction<
  typeof DeprecatedSectionList
>
const mockUseIntroInfo = useIntroInfo as jest.MockedFunction<
  typeof useIntroInfo
>
const mockUseSteps = useDeprecatedSteps as jest.MockedFunction<
  typeof useDeprecatedSteps
>
const mockUseLabwareIdsBySection = useLabwareIdsBySection as jest.MockedFunction<
  typeof useLabwareIdsBySection
>
const mockDeprecatedDeckmap = DeprecatedDeckMap as jest.MockedFunction<
  typeof DeprecatedDeckMap
>

const PICKUP_TIP_LABWARE_ID = 'PICKUP_TIP_LABWARE_ID'
const PRIMARY_PIPETTE_ID = 'PRIMARY_PIPETTE_ID'
const MOCK_DEPRECATED_SECTIONS = [
  'PRIMARY_PIPETTE_TIPRACKS' as DeprecatedSection,
]
const MOCK_RUN_ID = 'fakeRunId'

const MOCK_LABWARE_POSITION_CHECK_STEP_TIPRACK = {
  labwareId:
    '1d57fc10-67ad-11ea-9f8b-3b50068bd62d:opentrons/opentrons_96_filtertiprack_200ul/1',
  section: '',
  commands: [
    {
      command: 'pickUpTip',
      params: {
        pipette: PRIMARY_PIPETTE_ID,
        labware: PICKUP_TIP_LABWARE_ID,
      },
    },
  ],
} as any

const render = (
  props: React.ComponentProps<typeof DeprecatedGenericStepScreen>
) => {
  return renderWithProviders(<DeprecatedGenericStepScreen {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('DeprecatedGenericStepScreen', () => {
  let props: React.ComponentProps<typeof DeprecatedGenericStepScreen>

  beforeEach(() => {
    props = {
      selectedStep: MOCK_LABWARE_POSITION_CHECK_STEP_TIPRACK,
      setCurrentLabwareCheckStep: () => {},
      runId: MOCK_RUN_ID,
    } as any
    when(mockDeprecatedLabwarePositionCheckStepDetail)
      .calledWith(
        partialComponentPropsMatcher({
          selectedStep: MOCK_LABWARE_POSITION_CHECK_STEP_TIPRACK,
        })
      )
      .mockReturnValue(<div>Mock Labware Position Check Step Detail</div>)

    mockDeprecatedSectionList.mockReturnValue(<div>Mock SectionList </div>)
    mockDeprecatedDeckmap.mockReturnValue(<div>Mock DeckMap </div>)
    mockUseLabwareIdsBySection.mockReturnValue({})
    mockUseSteps.mockReturnValue([])

    when(mockUseIntroInfo).calledWith().mockReturnValue({
      primaryPipetteMount: 'left',
      secondaryPipetteMount: '',
      firstTiprackSlot: '2',
      sections: MOCK_DEPRECATED_SECTIONS,
    })
  })
  it('renders LabwarePositionCheckStepDetail component', () => {
    const { getByText } = render(props)
    expect(getByText('Mock Labware Position Check Step Detail')).toBeTruthy()
  })
  it('renders GenericStepScreenNav component and deckmap', () => {
    const { getByText } = render(props)
    getByText('Mock SectionList')
    getByText('Mock DeckMap')
  })
  it('renders null if useIntroInfo is null', () => {
    mockUseIntroInfo.mockReturnValue(null)
    const { container } = render(props)
    expect(container.firstChild).toBeNull()
  })
})
