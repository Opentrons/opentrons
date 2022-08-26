import * as React from 'react'
import { resetAllWhenMocks, when } from 'jest-when'
import { fireEvent, screen } from '@testing-library/react'
import withSinglechannelProtocol from '@opentrons/shared-data/protocol/fixtures/4/testModulesProtocol.json'
import withMultiChannelProtocol from '@opentrons/shared-data/protocol/fixtures/4/pipetteMultiChannelProtocolV4.json'
import {
  nestedTextMatcher,
  componentPropsMatcher,
  renderWithProviders,
} from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { useProtocolDetailsForRun } from '../../../Devices/hooks'
import { DeprecatedLabwarePositionCheckStepDetailModal } from '../DeprecatedLabwarePositionCheckStepDetailModal'
import { DeprecatedStepDetailText } from '../DeprecatedStepDetailText'

jest.mock('../DeprecatedLabwarePositionCheckStepDetailModal')
jest.mock('../../../Devices/hooks')

const mockUseProtocolDetailsForRun = useProtocolDetailsForRun as jest.MockedFunction<
  typeof useProtocolDetailsForRun
>
const mockDeprecatedLabwarePositionCheckStepDetailModal = DeprecatedLabwarePositionCheckStepDetailModal as jest.MockedFunction<
  typeof DeprecatedLabwarePositionCheckStepDetailModal
>
const PICKUP_TIP_LABWARE_ID = 'PICKUP_TIP_LABWARE_ID'
const PRIMARY_PIPETTE_ID = 'PRIMARY_PIPETTE_ID'
const MOCK_RUN_ID = 'fakeRunId'

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

const render = (
  props: React.ComponentProps<typeof DeprecatedStepDetailText>
) => {
  return renderWithProviders(<DeprecatedStepDetailText {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('DeprecatedStepDetailText', () => {
  let props: React.ComponentProps<typeof DeprecatedStepDetailText>
  beforeEach(() => {
    props = {
      selectedStep: mockLabwarePositionCheckStepTipRack,
      runId: MOCK_RUN_ID,
    }

    when(mockDeprecatedLabwarePositionCheckStepDetailModal)
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
    when(mockUseProtocolDetailsForRun)
      .calledWith(MOCK_RUN_ID)
      .mockReturnValue({
        protocolData: withSinglechannelProtocol,
      } as any)
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
    props = { ...props, pipetteChannels: 1 }
    const { getByText } = render(props)
    getByText('See how to tell if the pipette is centered')
    getByText(
      nestedTextMatcher(
        'The pipette nozzle should be centered above A1 in Opentrons 96 Filter Tip Rack 200 µL and level with the top of the tip.'
      )
    )
  })
  it('renders the 1 tip with labware text: labware_step_detail_labware', () => {
    props = {
      selectedStep: mockLabwarePositionCheckStepLabware,
      pipetteChannels: 1,
      runId: MOCK_RUN_ID,
    }
    const { getByText } = render(props)
    getByText('See how to tell if the pipette is centered')
    getByText(
      nestedTextMatcher(
        'The tip should be centered above A1 in NEST 96 Well Plate 100 µL PCR Full Skirt and level with the top of the labware.'
      )
    )
  })
  it('renders the 8 tips with tiprack text: labware_step_detail_tiprack_plural', () => {
    props = { ...props, pipetteChannels: 8 }
    when(mockUseProtocolDetailsForRun)
      .calledWith(MOCK_RUN_ID)
      .mockReturnValue({
        protocolData: withMultiChannelProtocol,
      } as any)

    const { getByText } = render(props)
    getByText('See how to tell if the pipette is centered')

    getByText(
      nestedTextMatcher(
        'The pipette nozzles should be centered above column 1 in Opentrons 96 Filter Tip Rack 200 µL and level with the top of the tips.'
      )
    )
  })
  it('renders the 8 tips with labware text: labware_step_detail_labware_plural', () => {
    props = {
      selectedStep: mockLabwarePositionCheckStepLabware,
      pipetteChannels: 8,
      runId: MOCK_RUN_ID,
    }
    when(mockUseProtocolDetailsForRun)
      .calledWith(MOCK_RUN_ID)
      .mockReturnValue({
        protocolData: withMultiChannelProtocol,
      } as any)

    const { getByText } = render(props)
    getByText('See how to tell if the pipette is centered')

    getByText(
      nestedTextMatcher(
        'The tips should be centered above column 1 in NEST 96 Well Plate 100 µL PCR Full Skirt and level with the top of the labware.'
      )
    )
  })
  it('returns null if protocolData is null', () => {
    when(mockUseProtocolDetailsForRun)
      .calledWith(MOCK_RUN_ID)
      .mockReturnValue({
        protocolData: null,
      } as any)
    const { container } = render(props)
    expect(container.firstChild).toBeNull()
  })
})
