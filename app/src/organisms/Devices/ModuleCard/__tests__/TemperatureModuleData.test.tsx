import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { StatusLabel } from '../../../../atoms/StatusLabel'
import { TemperatureModuleData } from '../TemperatureModuleData'
import { mockTemperatureModuleGen2 } from '../../../../redux/modules/__fixtures__'

jest.mock('../../../../atoms/StatusLabel')

const mockStatusLabel = StatusLabel as jest.MockedFunction<typeof StatusLabel>

const render = (props: React.ComponentProps<typeof TemperatureModuleData>) => {
  return renderWithProviders(<TemperatureModuleData {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('TemperatureModuleData', () => {
  let props: React.ComponentProps<typeof TemperatureModuleData>
  beforeEach(() => {
    props = {
      moduleStatus: mockTemperatureModuleGen2.status,
      targetTemp: mockTemperatureModuleGen2.data.targetTemp,
      currentTemp: mockTemperatureModuleGen2.data.currentTemp,
    }
    mockStatusLabel.mockReturnValue(<div>Mock StatusLabel</div>)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders a status', () => {
    const { getByText } = render(props)

    getByText('Mock StatusLabel')
  })

  it('renders correct temperature information when target temp is null', () => {
    const { getByText } = render(props)
    getByText('Target: N/A')
    getByText(`Current: ${props.currentTemp}°C`)
  })

  it('renders correct temperature information when target temp is not null', () => {
    props = {
      moduleStatus: mockTemperatureModuleGen2.status,
      targetTemp: 34,
      currentTemp: mockTemperatureModuleGen2.data.currentTemp,
    }
    const { getByText } = render(props)
    getByText(`Target: ${props.targetTemp}°C`)
    getByText(`Current: ${props.currentTemp}°C`)
  })
})
