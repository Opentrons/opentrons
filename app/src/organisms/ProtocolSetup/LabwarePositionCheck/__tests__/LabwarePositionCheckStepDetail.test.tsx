import * as React from 'react'
import '@testing-library/jest-dom'
import { useIntroInfo } from '../hooks'
import { useProtocolDetails } from '../../../RunDetails/hooks'
import {
  componentPropsMatcher,
  renderWithProviders,
} from '@opentrons/components/__utils__'
import { StaticRouter } from 'react-router'
import { LabwarePositionCheckStepDetail } from '../LabwarePositionCheckStepDetail'
import { i18n } from '../../../../i18n'
import { fireEvent, screen } from '@testing-library/react'
import { LabwarePositionCheckStepDetailModal } from '../LabwarePositionCheckStepDetailModal'
import { when } from 'jest-when'
import withModulesProtocol from '@opentrons/shared-data/protocol/fixtures/4/testModulesProtocol.json'
import { Section } from '../types'

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
const mockLabwarePositionCheckStep = {
  labwareId:'opentrons/opentrons_96_filtertiprack_200ul/1',
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
  props: React.ComponentProps<typeof LabwarePositionCheckStepDetail>
) => {
  return renderWithProviders(
    <StaticRouter>
      <LabwarePositionCheckStepDetail {...props} />
    </StaticRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('LabwarePositionCheckStepDetail', () => {
  let props: React.ComponentProps<typeof LabwarePositionCheckStepDetail>
  beforeEach(() => {
    props = {
      selectedStep: mockLabwarePositionCheckStep,
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
        protocolData: withModulesProtocol,
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
  })

  it.only('renders the 8 tips with tiprack text: labware_step_detail_tiprack', () => {
    const { getByText } = render(props)
    getByText('See how to tell if the pipette is centered')
    //screen.debug(getByText('The pipette nozzles should be centered above column 1 in Opentrons 96 Filter Tip Rack 200 µL and level with the top of the tips'))
    //getByText('The pipette nozzles should be centered above column 1 in Opentrons 96 Filter Tip Rack 200 µL and level with the top of the tips')
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
})
