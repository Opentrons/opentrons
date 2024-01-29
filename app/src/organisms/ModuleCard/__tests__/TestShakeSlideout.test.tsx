import * as React from 'react'
import { i18n } from '../../../i18n'
import { fireEvent, waitFor } from '@testing-library/react'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'
import { renderWithProviders } from '@opentrons/components'
import { getIsHeaterShakerAttached } from '../../../redux/config'
import { mockHeaterShaker } from '../../../redux/modules/__fixtures__'
import { useLatchControls } from '../hooks'
import { TestShakeSlideout } from '../TestShakeSlideout'
import { ModuleSetupModal } from '../ModuleSetupModal'

jest.mock('../../../redux/config')
jest.mock('@opentrons/react-api-client')
jest.mock('../hooks')
jest.mock('../ModuleSetupModal')

const mockGetIsHeaterShakerAttached = getIsHeaterShakerAttached as jest.MockedFunction<
  typeof getIsHeaterShakerAttached
>
const mockUseLiveCommandMutation = useCreateLiveCommandMutation as jest.MockedFunction<
  typeof useCreateLiveCommandMutation
>
const mockUseLatchControls = useLatchControls as jest.MockedFunction<
  typeof useLatchControls
>
const mockModuleSetupModal = ModuleSetupModal as jest.MockedFunction<
  typeof ModuleSetupModal
>

const render = (props: React.ComponentProps<typeof TestShakeSlideout>) => {
  return renderWithProviders(<TestShakeSlideout {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockOpenLatchHeaterShaker = {
  id: 'heatershaker_id',
  moduleModel: 'heaterShakerModuleV1',
  moduleType: 'heaterShakerModuleType',
  serialNumber: 'jkl123',
  hardwareRevision: 'heatershaker_v4.0',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: true,
  data: {
    labwareLatchStatus: 'idle_open',
    speedStatus: 'idle',
    temperatureStatus: 'idle',
    currentSpeed: null,
    currentTemperature: null,
    targetSpeed: null,
    targetTemp: null,
    errorDetails: null,
    status: 'idle',
  },
  usbPort: { path: '/dev/ot_module_heatershaker0', port: 1 },
} as any

const mockCloseLatchHeaterShaker = {
  id: 'heatershaker_id',
  moduleModel: 'heaterShakerModuleV1',
  moduleType: 'heaterShakerModuleType',
  serialNumber: 'jkl123',
  hardwareRevision: 'heatershaker_v4.0',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: true,
  data: {
    labwareLatchStatus: 'idle_closed',
    speedStatus: 'idle',
    temperatureStatus: 'idle',
    currentSpeed: null,
    currentTemperature: null,
    targetSpeed: null,
    targetTemp: null,
    errorDetails: null,
    status: 'idle',
  },
  usbPort: { path: '/dev/ot_module_heatershaker0', port: 1 },
} as any

const mockMovingHeaterShaker = {
  id: 'heatershaker_id',
  moduleModel: 'heaterShakerModuleV1',
  moduleType: 'heaterShakerModuleType',
  serialNumber: 'jkl123',
  hardwareRevision: 'heatershaker_v4.0',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: true,
  data: {
    labwareLatchStatus: 'idle_closed',
    speedStatus: 'speeding up',
    temperatureStatus: 'idle',
    currentSpeed: null,
    currentTemperature: null,
    targetSpeed: null,
    targetTemp: null,
    errorDetails: null,
    status: 'idle',
  },
  usbPort: { path: '/dev/ot_module_heatershaker0', port: 1 },
} as any

describe('TestShakeSlideout', () => {
  let props: React.ComponentProps<typeof TestShakeSlideout>
  let mockCreateLiveCommand = jest.fn()
  const mockToggleLatch = jest.fn()
  beforeEach(() => {
    props = {
      module: mockHeaterShaker,
      onCloseClick: jest.fn(),
      isExpanded: true,
    }
    mockUseLatchControls.mockReturnValue({
      toggleLatch: mockToggleLatch,
      isLatchClosed: true,
    } as any)
    mockCreateLiveCommand = jest.fn()
    mockCreateLiveCommand.mockResolvedValue(null)
    mockUseLiveCommandMutation.mockReturnValue({
      createLiveCommand: mockCreateLiveCommand,
    } as any)
    mockGetIsHeaterShakerAttached.mockReturnValue(true)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders the slideout information banner icon and description', () => {
    const { getByText, getByLabelText } = render(props)
    getByLabelText('information')
    getByText(
      'If you want to add labware to the module before doing a test shake, you can use the labware latch controls to hold the latches open.'
    )
  })

  it('renders the labware latch open button', () => {
    const { getByRole, getByText } = render(props)
    getByText('Labware Latch')
    getByText('open')
    const button = getByRole('button', { name: /Open Latch/i })
    expect(button).toBeEnabled()
  })

  it('renders a start button for speed setting', () => {
    const { getByText, getByRole } = render(props)

    getByText('Shake speed')

    const button = getByRole('button', { name: /Start/i })
    expect(button).toBeDisabled()
  })

  it('renders show attachment instructions link', () => {
    mockModuleSetupModal.mockReturnValue(<div>mockModuleSetupModal</div>)
    const { getByText } = render(props)

    const button = getByText('Show attachment instructions')
    fireEvent.click(button)
    getByText('mockModuleSetupModal')
  })

  it('start shake button should be disabled if the labware latch is open', () => {
    props = {
      module: mockOpenLatchHeaterShaker,
      onCloseClick: jest.fn(),
      isExpanded: true,
    }
    mockUseLatchControls.mockReturnValue({
      toggleLatch: mockToggleLatch,
      isLatchClosed: false,
    })

    const { getByRole } = render(props)
    const button = getByRole('button', { name: /Start/i })
    expect(button).toBeDisabled()
  })

  it('open latch button and input field should be disabled if the module is shaking', () => {
    props = {
      module: mockMovingHeaterShaker,
      onCloseClick: jest.fn(),
      isExpanded: true,
    }

    const { getByRole } = render(props)
    const button = getByRole('button', { name: /Open/i })
    const input = getByRole('spinbutton')
    expect(input).toBeDisabled()
    expect(button).toBeDisabled()
  })

  it('renders the open labware latch button and clicking it opens the latch', () => {
    props = {
      module: mockCloseLatchHeaterShaker,
      onCloseClick: jest.fn(),
      isExpanded: true,
    }

    const { getByRole } = render(props)
    const button = getByRole('button', { name: /Open/i })
    fireEvent.click(button)
    expect(mockUseLatchControls).toHaveBeenCalled()
  })

  it('entering an input for shake speed and clicking start should begin shaking', async () => {
    props = {
      module: mockHeaterShaker,
      onCloseClick: jest.fn(),
      isExpanded: true,
    }

    const { getByRole } = render(props)
    const button = getByRole('button', { name: /Start/i })
    const input = getByRole('spinbutton')
    fireEvent.change(input, { target: { value: '300' } })
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockCreateLiveCommand).toHaveBeenCalledWith({
        command: {
          commandType: 'heaterShaker/closeLabwareLatch',
          params: {
            moduleId: 'heatershaker_id',
          },
        },
      })
    })
    await waitFor(() => {
      expect(mockCreateLiveCommand).toHaveBeenCalledWith({
        command: {
          commandType: 'heaterShaker/setAndWaitForShakeSpeed',
          params: {
            moduleId: 'heatershaker_id',
            rpm: 300,
          },
        },
      })
    })
  })
})
