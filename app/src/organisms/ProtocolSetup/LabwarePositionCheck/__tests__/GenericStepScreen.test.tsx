import * as React from 'react'
import { when } from 'jest-when'
import {
  partialComponentPropsMatcher,
  renderWithProviders,
} from '@opentrons/components/src/testing/utils'
import { i18n } from '../../../../i18n'
import { GenericStepScreen } from '../GenericStepScreen'
import { LabwarePositionCheckStepDetail } from '../LabwarePositionCheckStepDetail'

jest.mock('../LabwarePositionCheckStepDetail')

const mockLabwarePositionCheckStepDetail = LabwarePositionCheckStepDetail as jest.MockedFunction<
  typeof LabwarePositionCheckStepDetail
>
const PICKUP_TIP_LABWARE_ID = 'PICKUP_TIP_LABWARE_ID'
const PRIMARY_PIPETTE_ID = 'PRIMARY_PIPETTE_ID'
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

const render = (props: React.ComponentProps<typeof GenericStepScreen>) => {
  return renderWithProviders(<GenericStepScreen {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('GenericStepScreen', () => {
  let props: React.ComponentProps<typeof GenericStepScreen>

  beforeEach(() => {
    props = {
      selectedStep: mockLabwarePositionCheckStepTipRack,
      setCurrentLabwareCheckStep: () => {},
    }
    when(mockLabwarePositionCheckStepDetail)
      .calledWith(
        partialComponentPropsMatcher({
          selectedStep: mockLabwarePositionCheckStepTipRack,
        })
      )
      .mockReturnValue(<div>Mock Labware Position Check Step Detail</div>)
  })
  it('renders LabwarePositionCheckStepDetail component', () => {
    const { getByText } = render(props)
    expect(getByText('Mock Labware Position Check Step Detail')).toBeTruthy()
  })
})
