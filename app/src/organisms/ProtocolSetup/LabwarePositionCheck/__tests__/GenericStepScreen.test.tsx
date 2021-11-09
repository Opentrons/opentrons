import * as React from 'react'
import { when } from 'jest-when'
import {
  partialComponentPropsMatcher,
  renderWithProviders,
} from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { GenericStepScreen } from '../GenericStepScreen'
import { LabwarePositionCheckStepDetail } from '../LabwarePositionCheckStepDetail'
import { SectionList } from '../SectionList'
import { DeckMap } from '../DeckMap'
import { useIntroInfo, useLabwareIdsBySection } from '../hooks'
import { Section } from '../types'

jest.mock('../LabwarePositionCheckStepDetail')
jest.mock('../SectionList')
jest.mock('../DeckMap')
jest.mock('../hooks')

const mockLabwarePositionCheckStepDetail = LabwarePositionCheckStepDetail as jest.MockedFunction<
  typeof LabwarePositionCheckStepDetail
>
const mockSectionList = SectionList as jest.MockedFunction<typeof SectionList>
const mockUseIntroInfo = useIntroInfo as jest.MockedFunction<
  typeof useIntroInfo
>
const mockUseLabwareIdsBySection = useLabwareIdsBySection as jest.MockedFunction<
  typeof useLabwareIdsBySection
>
const mockDeckmap = DeckMap as jest.MockedFunction<typeof DeckMap>

const PICKUP_TIP_LABWARE_ID = 'PICKUP_TIP_LABWARE_ID'
const PRIMARY_PIPETTE_ID = 'PRIMARY_PIPETTE_ID'
const MOCK_SECTIONS = ['PRIMARY_PIPETTE_TIPRACKS' as Section]

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

const render = (props: React.ComponentProps<typeof GenericStepScreen>) => {
  return renderWithProviders(<GenericStepScreen {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('GenericStepScreen', () => {
  let props: React.ComponentProps<typeof GenericStepScreen>

  beforeEach(() => {
    props = {
      selectedStep: MOCK_LABWARE_POSITION_CHECK_STEP_TIPRACK,
      setCurrentLabwareCheckStep: () => {},
    } as any
    when(mockLabwarePositionCheckStepDetail)
      .calledWith(
        partialComponentPropsMatcher({
          selectedStep: MOCK_LABWARE_POSITION_CHECK_STEP_TIPRACK,
        })
      )
      .mockReturnValue(<div>Mock Labware Position Check Step Detail</div>)

    mockSectionList.mockReturnValue(<div>Mock SectionList </div>)
    mockDeckmap.mockReturnValue(<div>Mock DeckMap </div>)
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
