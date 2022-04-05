import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { StatusLabel } from '../../../../atoms/StatusLabel'
import { HeaterShakerModuleData } from '../HeaterShakerModuleData'

jest.mock('../../../../atoms/StatusLabel')

const mockStatusLabel = StatusLabel as jest.MockedFunction<typeof StatusLabel>

const render = (props: React.ComponentProps<typeof HeaterShakerModuleData>) => {
  return renderWithProviders(<HeaterShakerModuleData {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('HeaterShakerModuleData', () => {
  let props: React.ComponentProps<typeof HeaterShakerModuleData>
  beforeEach(() => {
    props = {
      heaterStatus: 'idle',
      shakerStatus: 'idle',
      latchStatus: 'idle_unknown',
      targetTemp: null,
      currentTemp: null,
      targetSpeed: null,
      currentSpeed: null,
    }
    mockStatusLabel.mockReturnValue(<div>Mock StatusLabel</div>)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders an idle status', () => {
    const { getByText } = render(props)
    expect(getByText('Mock StatusLabel')).toHaveStyle(
      'backgroundColor: COLORS.medGrey'
    )
  })

  it('renders a holding at target status', () => {
    props = {
      heaterStatus: 'holding at target',
      shakerStatus: 'idle',
      latchStatus: 'idle_unknown',
      targetTemp: null,
      currentTemp: null,
      targetSpeed: 200,
      currentSpeed: 200,
    }
    const { getByText } = render(props)
    expect(getByText('Mock StatusLabel')).toHaveStyle(
      'backgroundColor: C_SKY_BLUE'
    )
  })

  it('renders a heating status', () => {
    props = {
      heaterStatus: 'heating',
      shakerStatus: 'idle',
      latchStatus: 'idle_unknown',
      targetTemp: 42,
      currentTemp: 39,
      targetSpeed: null,
      currentSpeed: null,
    }
    const { getByText } = render(props)
    expect(getByText('Mock StatusLabel')).toHaveStyle(
      'backgroundColor: COLORS.blue'
    )
  })

  it('renders a shaking status', () => {
    props = {
      heaterStatus: 'shaking',
      shakerStatus: 'idle',
      latchStatus: 'idle_unknown',
      targetTemp: null,
      currentTemp: null,
      targetSpeed: 200,
      currentSpeed: 200,
    }
    const { getByText } = render(props)
    getByText('Target: 200 RPM')
    getByText('Current: 200 RPM')
    expect(getByText('Mock StatusLabel')).toHaveStyle(
      'backgroundColor: COLORS.blue'
    )
  })

  it('renders correct information when status is idle', () => {
    const { getByText } = render(props)
    getByText('Target: N/A RPM')
    getByText('Labware Latch')
    getByText('idle_unknown')
  })
})
