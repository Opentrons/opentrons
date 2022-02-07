import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { StatusLabel } from '../../../../atoms/StatusLabel'
import { ThermocyclerModuleData } from '../ThermocyclerModuleData'
import { mockThermocycler } from '../../../../redux/modules/__fixtures__'

jest.mock('../../../../atoms/StatusLabel')

const mockStatusLabel = StatusLabel as jest.MockedFunction<typeof StatusLabel>

const render = (props: React.ComponentProps<typeof ThermocyclerModuleData>) => {
  return renderWithProviders(<ThermocyclerModuleData {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ThermocyclerModuleData', () => {
  let props: React.ComponentProps<typeof ThermocyclerModuleData>
  beforeEach(() => {
    props = {
      status: mockThermocycler.status,
      currentTemp: mockThermocycler.data.currentTemp,
      targetTemp: mockThermocycler.data.targetTemp,
      lidTemp: mockThermocycler.data.lidTemp,
      lidTarget: mockThermocycler.data.lidTarget,
    }
    mockStatusLabel.mockReturnValue(<div>Mock Thermocycler StatusLabel</div>)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders a status', () => {
    const { getAllByText } = render(props)

    getAllByText('Mock Thermocycler StatusLabel')
  })

  it('renders thermocycler lid temperature data', () => {
    const { getByText, getByTitle } = render(props)

    getByText('Lid')
    getByTitle('lid_target_temp')
    getByTitle('lid_temp')
  })

  it('renders thermocycler block temperature data', () => {
    const { getByText, getByTitle } = render(props)

    getByText('Block')
    getByTitle('tc_target_temp')
    getByTitle('tc_current_temp')
  })
})
