import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { useRequiredProtocolHardware } from '../../../Protocols/hooks'
import { Hardware } from '../Hardware'

jest.mock('../../../Protocols/hooks')

const mockUseRequiredProtocolHardware = useRequiredProtocolHardware as jest.MockedFunction<
  typeof useRequiredProtocolHardware
>

const MOCK_PROTOCOL_ID = 'mock_protocol_id'

const render = (props: React.ComponentProps<typeof Hardware>) => {
  return renderWithProviders(<Hardware {...props} />, {
    i18nInstance: i18n,
  })
}

describe('Hardware', () => {
  let props: React.ComponentProps<typeof Hardware>
  beforeEach(() => {
    props = {
      protocolId: MOCK_PROTOCOL_ID,
    }
    when(mockUseRequiredProtocolHardware)
      .calledWith(MOCK_PROTOCOL_ID)
      .mockReturnValue({
        requiredProtocolHardware: [
          {
            hardwareType: 'pipette',
            pipetteName: 'p10_single',
            mount: 'left',
            connected: true,
          },
          {
            hardwareType: 'pipette',
            pipetteName: 'p1000_single',
            mount: 'right',
            connected: false,
          },
          {
            hardwareType: 'module',
            moduleModel: 'heaterShakerModuleV1',
            slot: '1',
            connected: true,
          },
          {
            hardwareType: 'module',
            moduleModel: 'temperatureModuleV2',
            slot: '3',
            connected: false,
          },
        ],
        isLoading: false,
      })
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should render column headers that indicate where the hardware is, what is called, and whether it is connected', () => {
    const { getByRole } = render(props)[0]
    getByRole('columnheader', { name: 'Location' })
    getByRole('columnheader', { name: 'Hardware' })
  })
  it('should render the correct location, name, and connected status in each table row', () => {
    const { getByRole } = render(props)[0]
    getByRole('row', { name: 'Left Mount P10 Single-Channel GEN1' })
    getByRole('row', {
      name: 'Right Mount P1000 Single-Channel GEN1',
    })
    getByRole('row', { name: '1 Heater-Shaker Module GEN1' })
    getByRole('row', { name: '3 Temperature Module GEN2' })
  })
})
