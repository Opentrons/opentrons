import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { fireEvent } from '@testing-library/react'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'
import { i18n } from '../../../../i18n'
import { TestShake } from '../TestShake'
import { HeaterShakerModuleCard } from '../HeaterShakerModuleCard'
import { mockHeaterShaker } from '../../../../redux/modules/__fixtures__'

jest.mock('@opentrons/react-api-client')
jest.mock('../HeaterShakerModuleCard')

const mockUseLiveCommandMutation = useCreateLiveCommandMutation as jest.MockedFunction<
  typeof useCreateLiveCommandMutation
>

const mockHeaterShakerModuleCard = HeaterShakerModuleCard as jest.MockedFunction<
  typeof HeaterShakerModuleCard
>

const render = (props: React.ComponentProps<typeof TestShake>) => {
  return renderWithProviders(<TestShake {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockOpenLatchHeaterShaker = {
  model: 'heaterShakerModuleV1',
  type: 'heaterShakerModuleType',
  port: '/dev/ot_module_heatershaker0',
  serial: 'jkl123',
  revision: 'heatershaker_v4.0',
  fwVersion: 'v2.0.0',
  status: 'idle',
  hasAvailableUpdate: true,
  data: {
    labwareLatchStatus: 'idle_open',
    speedStatus: 'idle',
    temperatureStatus: 'idle',
    currentSpeed: null,
    currentTemp: null,
    targetSpeed: null,
    targetTemp: null,
    errorDetails: null,
  },
  usbPort: { hub: 1, port: 1 },
} as any

const mockCloseLatchHeaterShaker = {
  model: 'heaterShakerModuleV1',
  type: 'heaterShakerModuleType',
  port: '/dev/ot_module_heatershaker0',
  serial: 'jkl123',
  revision: 'heatershaker_v4.0',
  fwVersion: 'v2.0.0',
  status: 'idle',
  hasAvailableUpdate: true,
  data: {
    labwareLatchStatus: 'idle_closed',
    speedStatus: 'idle',
    temperatureStatus: 'idle',
    currentSpeed: null,
    currentTemp: null,
    targetSpeed: null,
    targetTemp: null,
    errorDetails: null,
  },
  usbPort: { hub: 1, port: 1 },
} as any

describe('TestShake', () => {
  let props: React.ComponentProps<typeof TestShake>
  let mockCreateLiveCommand = jest.fn()
  beforeEach(() => {
    props = {
      setCurrentPage: jest.fn(),
      module: mockHeaterShaker,
    }
    mockCreateLiveCommand = jest.fn()
    mockCreateLiveCommand.mockResolvedValue(null)
    mockUseLiveCommandMutation.mockReturnValue({
      createLiveCommand: mockCreateLiveCommand,
    } as any)
    mockHeaterShakerModuleCard.mockReturnValue(
      <div>Mock Heater Shaker Module Card</div>
    )
  })
  it('renders the correct title', () => {
    const { getByText } = render(props)
    getByText('Step 4 of 4: Test shake')
  })

  it('renders the information banner icon and description', () => {
    const { getByText, getByLabelText } = render(props)
    getByLabelText('information')
    getByText(
      'If you want to add labware to the module before doing a test shake, you can use the labware latch controls to hold the latches open.'
    )
  })

  it('renders a heater shaker module card', () => {
    const { getByText } = render(props)

    getByText('Mock Heater Shaker Module Card')
  })

  it('renders the open labware latch button and is enabled', () => {
    const { getByRole } = render(props)
    const button = getByRole('button', { name: /Open Labware Latch/i })
    expect(button).toBeEnabled()
  })

  it('renders the start shaking button and is enabled', () => {
    const { getByRole } = render(props)
    const button = getByRole('button', { name: /Start Shaking/i })
    expect(button).toBeEnabled()
  })

  it('renders an input field for speed setting', () => {
    const { getByText, getByRole } = render(props)

    getByText('Set shake speed')
    getByRole('spinbutton')
  })

  it('renders troubleshooting accordion and contents', () => {
    const { getByText, getByRole } = render(props)

    const troubleshooting = getByText('Troubleshooting')
    fireEvent.click(troubleshooting)

    getByText(
      'Return to Step 1 to see instructions for securing the module to the deck.'
    )
    const buttonStep1 = getByRole('button', { name: /Go to Step 1/i })
    expect(buttonStep1).toBeEnabled()

    getByText(
      'Return to Step 2 to see instructions for securing the thermal adapter to the module.'
    )
    const buttonStep2 = getByRole('button', { name: /Go to Step 2/i })
    expect(buttonStep2).toBeEnabled()
  })

  it('start shake button should be disabled if the labware latch is open', () => {
    props = {
      module: mockOpenLatchHeaterShaker,
      setCurrentPage: jest.fn(),
    }

    const { getByRole } = render(props)
    const button = getByRole('button', { name: /Start/i })
    expect(button).toBeDisabled()
  })

  it('clicking the open latch button should open the heater shaker latch', () => {
    props = {
      module: mockCloseLatchHeaterShaker,
      setCurrentPage: jest.fn(),
    }

    const { getByRole } = render(props)
    const button = getByRole('button', { name: /Open Labware Latch/i })
    fireEvent.click(button)

    expect(mockCreateLiveCommand).toHaveBeenCalledWith({
      command: {
        commandType: 'heaterShakerModule/openLatch',
        params: {
          moduleId: mockCloseLatchHeaterShaker.id,
        },
      },
    })
  })

  it('clicking the close latch button should close the heater shaker latch', () => {
    props = {
      module: mockOpenLatchHeaterShaker,
      setCurrentPage: jest.fn(),
    }

    const { getByRole } = render(props)
    const button = getByRole('button', { name: /Close Labware Latch/i })
    fireEvent.click(button)

    expect(mockCreateLiveCommand).toHaveBeenCalledWith({
      command: {
        commandType: 'heaterShakerModule/closeLatch',
        params: {
          moduleId: mockOpenLatchHeaterShaker.id,
        },
      },
    })
  })

  it('entering an input for shake speed and clicking start should begin shaking', () => {
    props = {
      module: mockHeaterShaker,
      setCurrentPage: jest.fn(),
    }

    const { getByRole } = render(props)
    const button = getByRole('button', { name: /Start/i })
    const input = getByRole('spinbutton')
    fireEvent.change(input, { target: { value: '300' } })
    fireEvent.click(button)

    expect(mockCreateLiveCommand).toHaveBeenCalledWith({
      command: {
        commandType: 'heaterShakerModule/setTargetShakeSpeed',
        params: {
          moduleId: 'heatershaker_id',
          rpm: 300,
        },
      },
    })
  })
})
