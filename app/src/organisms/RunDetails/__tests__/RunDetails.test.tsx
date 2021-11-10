import * as React from 'react'
import '@testing-library/jest-dom'
import { renderWithProviders } from '@opentrons/components'
import { when } from 'jest-when'
import { RunDetails } from '..'
import { i18n } from '../../../i18n'
import { useProtocolDetails } from '../hooks'

jest.mock('../hooks')

const mockUseProtocolDetails = useProtocolDetails as jest.MockedFunction<
  typeof useProtocolDetails
>

const PRIMARY_PIPETTE_ID = 'PRIMARY_PIPETTE_ID'
const PRIMARY_PIPETTE_NAME = 'PRIMARY_PIPETTE_NAME'
const PICKUP_TIP_LABWARE_ID = 'PICKUP_TIP_LABWARE_ID'
const LABWARE_DEF_ID = 'LABWARE_DEF_ID'
const LABWARE_DEF = {
  ordering: [['A1', 'A2']],
}

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

const render = () => {
  return renderWithProviders(<RunDetails />, {
    i18nInstance: i18n,
  })[0]
}

describe('RunDetails', () => {
  beforeEach(() => {
    when(mockUseProtocolDetails)
      .calledWith()
      .mockReturnValue({
        protocolData: {
          labware: {
            [mockLabwarePositionCheckStepTipRack.labwareId]: {
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

  it('renders null if protocol data is null', () => {
    mockUseProtocolDetails.mockReturnValue({ protocolData: null } as any)
    const { container } = render()
    expect(container.firstChild).toBeNull()
  })
  it('renders protocol title', () => {
    const { getByText } = render()
    getByText('Protocol -')
  })
  it.todo('renders run detail command component')
})
