import * as React from 'react'
import { when } from 'jest-when'
import {
  partialComponentPropsMatcher,
  renderWithProviders,
} from '@opentrons/components/src/testing/utils'
import { i18n } from '../../../../i18n'
import { LabwarePositionCheckStepDetail } from '../LabwarePositionCheckStepDetail'
import { StepDetailText } from '../StepDetailText'

jest.mock('../StepDetailText')

const mockStepDetailText = StepDetailText as jest.MockedFunction<
  typeof StepDetailText
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

const render = (
  props: React.ComponentProps<typeof LabwarePositionCheckStepDetail>
) => {
  return renderWithProviders(<LabwarePositionCheckStepDetail {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('LabwarePositionCheckStepDetail', () => {
  let props: React.ComponentProps<typeof LabwarePositionCheckStepDetail>
  beforeEach(() => {
    props = {
      selectedStep: mockLabwarePositionCheckStepTipRack,
    }
    when(mockStepDetailText)
      .calledWith(
        partialComponentPropsMatcher({
          selectedStep: mockLabwarePositionCheckStepTipRack,
        })
      )
      .mockReturnValue(<div>Mock Step Detail Text </div>)
  })
  it('renders StepDetailText component', () => {
    const { getByText } = render(props)
    expect(getByText('Mock Step Detail Text')).toBeTruthy()
  })
})
