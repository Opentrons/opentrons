import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { StatusLabel } from '../../../atoms/StatusLabel'
import { HeaterShakerModuleData } from '../HeaterShakerModuleData'

jest.mock('../../../atoms/StatusLabel')

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
      moduleData: {
        labwareLatchStatus: 'idle_unknown',
        speedStatus: 'idle',
        temperatureStatus: 'idle',
        currentSpeed: null,
        currentTemperature: null,
        targetSpeed: null,
        targetTemperature: null,
        errorDetails: null,
        status: 'idle',
      },
    }
    mockStatusLabel.mockReturnValue(<div>Mock StatusLabel</div>)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders an idle status', () => {
    const { getByText } = render(props)
    expect(getByText('Mock StatusLabel')).toHaveStyle(
      'backgroundColor: LEGACY_COLORS.medGreyEnabled'
    )
  })

  it('renders a holding at target status', () => {
    props = {
      moduleData: {
        labwareLatchStatus: 'idle_unknown',
        speedStatus: 'idle',
        temperatureStatus: 'holding at target',
        currentSpeed: 200,
        currentTemperature: null,
        targetSpeed: 200,
        targetTemperature: null,
        errorDetails: null,
        status: 'idle',
      },
    }
    const { getByText } = render(props)
    expect(getByText('Mock StatusLabel')).toHaveStyle(
      'backgroundColor: C_SKY_BLUE'
    )
  })

  it('renders a heating status', () => {
    props = {
      moduleData: {
        labwareLatchStatus: 'idle_unknown',
        speedStatus: 'idle',
        temperatureStatus: 'heating',
        currentSpeed: null,
        currentTemperature: 39,
        targetSpeed: null,
        targetTemperature: 42,
        errorDetails: null,
        status: 'idle',
      },
    }
    const { getByText } = render(props)
    expect(getByText('Mock StatusLabel')).toHaveStyle(
      'backgroundColor: LEGACY_COLORS.blueEnabled'
    )
  })

  it('renders a shaking status', () => {
    props = {
      moduleData: {
        labwareLatchStatus: 'idle_unknown',
        speedStatus: 'speeding up',
        temperatureStatus: 'idle',
        currentSpeed: 200,
        currentTemperature: null,
        targetSpeed: 200,
        targetTemperature: null,
        errorDetails: null,
        status: 'idle',
      },
    }
    const { getByText } = render(props)
    getByText('Target: 200 rpm')
    getByText('Current: 200 rpm')
    expect(getByText('Mock StatusLabel')).toHaveStyle(
      'backgroundColor: LEGACY_COLORS.blueEnabled'
    )
  })

  it('renders an idle shaking status', () => {
    props = {
      moduleData: {
        labwareLatchStatus: 'idle_unknown',
        speedStatus: 'idle',
        temperatureStatus: 'idle',
        currentSpeed: 0,
        currentTemperature: null,
        targetSpeed: null,
        targetTemperature: null,
        errorDetails: null,
        status: 'idle',
      },
    }
    const { getByText } = render(props)
    getByText('Target: N/A')
    getByText('Current: 0 rpm')
    expect(getByText('Mock StatusLabel')).toHaveStyle(
      'backgroundColor: LEGACY_COLORS.medGreyEnabled'
    )
  })

  it('renders an error shaking status', () => {
    props = {
      moduleData: {
        labwareLatchStatus: 'idle_unknown',
        speedStatus: 'error',
        temperatureStatus: 'idle',
        currentSpeed: 200,
        currentTemperature: null,
        targetSpeed: 200,
        targetTemperature: null,
        errorDetails: null,
        status: 'idle',
      },
    }
    const { getByText } = render(props)
    getByText('Target: 200 rpm')
    getByText('Current: 200 rpm')
    expect(getByText('Mock StatusLabel')).toHaveStyle(
      'backgroundColor: COLORS.yellow20'
    )
  })

  it('renders an idle temp status', () => {
    props = {
      moduleData: {
        labwareLatchStatus: 'idle_unknown',
        speedStatus: 'idle',
        temperatureStatus: 'idle',
        currentSpeed: 0,
        currentTemperature: null,
        targetSpeed: null,
        targetTemperature: null,
        errorDetails: null,
        status: 'idle',
      },
    }
    const { getByText } = render(props)
    getByText('Target: N/A')
    getByText('Current: 0 rpm')
    expect(getByText('Mock StatusLabel')).toHaveStyle(
      'backgroundColor: LEGACY_COLORS.medGreyEnabled'
    )
  })

  it('renders a cooling temp status', () => {
    props = {
      moduleData: {
        labwareLatchStatus: 'idle_unknown',
        speedStatus: 'idle',
        temperatureStatus: 'cooling',
        currentSpeed: null,
        currentTemperature: 60,
        targetSpeed: null,
        targetTemperature: 42,
        errorDetails: null,
        status: 'idle',
      },
    }
    const { getByText } = render(props)
    expect(getByText('Mock StatusLabel')).toHaveStyle(
      'backgroundColor: LEGACY_COLORS.blueEnabled'
    )
  })

  it('renders a correct text when latch is opened', () => {
    props = {
      moduleData: {
        labwareLatchStatus: 'idle_open',
        speedStatus: 'idle',
        temperatureStatus: 'cooling',
        currentSpeed: null,
        currentTemperature: 60,
        targetSpeed: null,
        targetTemperature: 42,
        errorDetails: null,
        status: 'idle',
      },
    }
    const { getByText } = render(props)
    getByText('open')
  })

  it('renders a correct text when latch is opening', () => {
    props = {
      moduleData: {
        labwareLatchStatus: 'opening',
        speedStatus: 'idle',
        temperatureStatus: 'cooling',
        currentSpeed: null,
        currentTemperature: 60,
        targetSpeed: null,
        targetTemperature: 42,
        errorDetails: null,
        status: 'idle',
      },
    }
    const { getByText } = render(props)
    getByText('open')
  })

  it('renders a correct text when latch is unknown', () => {
    props = {
      moduleData: {
        labwareLatchStatus: 'idle_unknown',
        speedStatus: 'idle',
        temperatureStatus: 'cooling',
        currentSpeed: null,
        currentTemperature: 60,
        targetSpeed: null,
        targetTemperature: 42,
        errorDetails: null,
        status: 'idle',
      },
    }
    const { getByText } = render(props)
    getByText('open')
  })

  it('renders a correct text when latch is closing and is not shaking', () => {
    props = {
      moduleData: {
        labwareLatchStatus: 'closing',
        speedStatus: 'idle',
        temperatureStatus: 'cooling',
        currentSpeed: null,
        currentTemperature: 60,
        targetSpeed: null,
        targetTemperature: 42,
        errorDetails: null,
        status: 'idle',
      },
    }
    const { getByText } = render(props)
    getByText('Closed')
  })

  it('renders a correct text when latch is closing and is shaking', () => {
    props = {
      moduleData: {
        labwareLatchStatus: 'closing',
        speedStatus: 'speeding up',
        temperatureStatus: 'cooling',
        currentSpeed: 200,
        currentTemperature: 60,
        targetSpeed: 500,
        targetTemperature: 42,
        errorDetails: null,
        status: 'idle',
      },
    }
    const { getByText, getByTestId } = render(props)
    getByText('Closed and Locked')
    getByTestId('HeaterShakerModuleData_latch_lock')
  })

  it('renders correct information when status is idle', () => {
    const { getByText } = render(props)
    getByText('Target: N/A')
    getByText('Labware Latch')
    getByText(/Open/i)
  })
})
