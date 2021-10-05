import * as React from 'react'
import '@testing-library/jest-dom'
import { resetAllWhenMocks, when } from 'jest-when'
import { fireEvent, screen } from '@testing-library/react'
import withSinglechannelProtocol from '@opentrons/shared-data/protocol/fixtures/4/testModulesProtocol.json'
import withMultiChannelProtocol from '@opentrons/shared-data/protocol/fixtures/4/pipetteMultiChannelProtocolV4.json'
import { nestedTextMatcher } from '@opentrons/components/src/testing/utils/nestedTextMatcher'
import {
  componentPropsMatcher,
  renderWithProviders,
} from '@opentrons/components/src/testing/utils'
import { i18n } from '../../../../i18n'
import { useProtocolDetails } from '../../../RunDetails/hooks'
import { LabwarePositionCheckStepDetailModal } from '../LabwarePositionCheckStepDetailModal'
import { StepDetailText } from '../StepDetailText'
import { useIntroInfo } from '../hooks'
import type { Section } from '../types'

jest.mock('../LabwarePositionCheckStepDetailModal')
jest.mock('../hooks')
jest.mock('../../../RunDetails/hooks')

const mockUseIntroInfo = useIntroInfo as jest.MockedFunction<
  typeof useIntroInfo
>
const mockUseProtocolDetails = useProtocolDetails as jest.MockedFunction<
  typeof useProtocolDetails
>
const mockLabwarePositionCheckStepDetailModal = LabwarePositionCheckStepDetailModal as jest.MockedFunction<
  typeof LabwarePositionCheckStepDetailModal
>
const PICKUP_TIP_LABWARE_ID = 'PICKUP_TIP_LABWARE_ID'
const PRIMARY_PIPETTE_ID = 'PRIMARY_PIPETTE_ID'

const MOCK_SECTIONS = ['MOCK_PRIMARY_PIPETTE_TIPRACKS' as Section]
const mockLabwarePositionCheckStepTipRack = {
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

const mockLabwarePositionCheckStepLabware = {
  labwareId:
    '24274d20-67ad-11ea-9f8b-3b50068bd62d:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1',
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

const render = (props: React.ComponentProps<typeof StepDetailText>) => {
  return renderWithProviders(<StepDetailText {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('StepDetailText', () => {
  let props: React.ComponentProps<typeof StepDetailText>
  beforeEach(() => {
    props = {
      selectedStep: mockLabwarePositionCheckStepTipRack,
    }

    when(mockLabwarePositionCheckStepDetailModal)
      .calledWith(
        componentPropsMatcher({
          onCloseClick: expect.anything(),
        })
      )
      .mockImplementation(({ onCloseClick }) => (
        <div onClick={onCloseClick}>
          mock labware position check step detail modal
        </div>
      ))
    when(mockUseProtocolDetails)
      .calledWith()
      .mockReturnValue({
        protocolData: withSinglechannelProtocol,
      } as any)

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

  afterEach(() => {
    resetAllWhenMocks()
    jest.restoreAllMocks()
  })

  it('opens up the LPC help modal when clicked', () => {
    const { getByText } = render(props)

    expect(
      screen.queryByText('mock labware position check step detail modal')
    ).toBeNull()
    const helpLink = getByText('See how to tell if the pipette is centered')
    fireEvent.click(helpLink)
    getByText('mock labware position check step detail modal')
  })
  it('closes the LPC help modal when closed', () => {
    const { getByText } = render(props)

    const helpLink = getByText('See how to tell if the pipette is centered')
    fireEvent.click(helpLink)
    const mockModal = getByText('mock labware position check step detail modal')
    fireEvent.click(mockModal)
    expect(
      screen.queryByText('mock labware position check step detail modal')
    ).toBeNull()
  })
  it('renders the 1 tip with tiprack text: labware_step_detail_tiprack', () => {
    const { getByText } = render(props)
    getByText('See how to tell if the pipette is centered')
    nestedTextMatcher(
      'The pipette nozzle should be centered above A1 in Opentrons 96 Filter Tip Rack 200 µl and level with the top of the tip.'
    )
  })
  it('renders the 1 tip with labware text: labware_step_detail_labware', () => {
    props = { selectedStep: mockLabwarePositionCheckStepLabware }
    const { getByText } = render(props)
    getByText('See how to tell if the pipette is centered')
    nestedTextMatcher(
      'The tip should be centered above A1 in NEST 96 Well Plate 100 µL PCR Full Skirt and level with the top of the labware.'
    )
  })
  it('renders the 8 tips with tiprack text: labware_step_detail_tiprack_plural', () => {
    when(mockUseProtocolDetails)
      .calledWith()
      .mockReturnValue({
        protocolData: withMultiChannelProtocol,
      } as any)
    when(mockUseIntroInfo).calledWith().mockReturnValue({
      primaryTipRackSlot: '1',
      primaryTipRackName: 'Opentrons 96 Filter Tip Rack 200 µL',
      primaryPipetteMount: 'left',
      secondaryPipetteMount: '',
      numberOfTips: 8,
      firstStepLabwareSlot: '2',
      sections: MOCK_SECTIONS,
    })
    const { getByText } = render(props)
    getByText('See how to tell if the pipette is centered')

    nestedTextMatcher(
      'The pipette nozzle should be centered above column 1 in Opentrons 96 Filter Tip Rack 200 µL and level with the top of the tip.'
    )
  })
  it('renders the 8 tips with labware text: labware_step_detail_labware_plural', () => {
    props = { selectedStep: mockLabwarePositionCheckStepLabware }
    when(mockUseProtocolDetails)
      .calledWith()
      .mockReturnValue({
        protocolData: withMultiChannelProtocol,
      } as any)
    when(mockUseIntroInfo).calledWith().mockReturnValue({
      primaryTipRackSlot: '1',
      primaryTipRackName: 'Opentrons 96 Filter Tip Rack 200 µL',
      primaryPipetteMount: 'left',
      secondaryPipetteMount: '',
      numberOfTips: 8,
      firstStepLabwareSlot: '2',
      sections: MOCK_SECTIONS,
    })
    const { getByText } = render(props)
    getByText('See how to tell if the pipette is centered')

    nestedTextMatcher(
      'The tips should be centered above column 1 in NEST 96 Well Plate 100 µL PCR Full Skirt and level with the top of the labware.'
    )
  })
  it('returns null if protocolData is null', () => {
    when(mockUseProtocolDetails)
      .calledWith()
      .mockReturnValue({
        protocolData: null,
      } as any)
    const { container } = render(props)
    expect(container.firstChild).toBeNull()
  })
  it('returns null if introInfo is null', () => {
    when(mockUseIntroInfo).calledWith().mockReturnValue(null)
    const { container } = render(props)
    expect(container.firstChild).toBeNull()
  })
})
