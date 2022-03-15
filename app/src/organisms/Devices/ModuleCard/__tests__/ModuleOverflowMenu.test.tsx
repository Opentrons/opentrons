import * as React from 'react'
import { COLORS, renderWithProviders } from '@opentrons/components'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'
import { fireEvent } from '@testing-library/react'
import { i18n } from '../../../../i18n'
import {
  mockMagneticModule,
  mockTemperatureModuleGen2,
  mockThermocycler,
  mockHeaterShaker,
} from '../../../../redux/modules/__fixtures__'
import { HeaterShakerWizard } from '../../HeaterShakerWizard'
import { ModuleOverflowMenu } from '../ModuleOverflowMenu'

jest.mock('../../HeaterShakerWizard')
jest.mock('@opentrons/react-api-client')

const mocUseLiveCommandMutation = useCreateLiveCommandMutation as jest.MockedFunction<
  typeof useCreateLiveCommandMutation
>

const mockHeaterShakerWizard = HeaterShakerWizard as jest.MockedFunction<
  typeof HeaterShakerWizard
>

const render = (props: React.ComponentProps<typeof ModuleOverflowMenu>) => {
  return renderWithProviders(<ModuleOverflowMenu {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockMovingHeaterShaker = {
  model: 'heaterShakerModuleV1',
  type: 'heaterShakerModuleType',
  port: '/dev/ot_module_thermocycler0',
  serial: 'jkl123',
  revision: 'heatershaker_v4.0',
  fwVersion: 'v2.0.0',
  status: 'idle',
  hasAvailableUpdate: true,
  data: {
    labwareLatchStatus: 'idle_unknown',
    speedStatus: 'speeding up',
    temperatureStatus: 'idle',
    currentSpeed: null,
    currentTemp: null,
    targetSpeed: null,
    targetTemp: null,
    errorDetails: null,
  },
  usbPort: { hub: 1, port: 1 },
} as any

const mockOpenLatchHeaterShaker = {
  model: 'heaterShakerModuleV1',
  type: 'heaterShakerModuleType',
  port: '/dev/ot_module_thermocycler0',
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

describe('ModuleOverflowMenu', () => {
  let props: React.ComponentProps<typeof ModuleOverflowMenu>
  const mockCreateCommand = jest.fn()
  beforeEach(() => {
    props = {
      module: mockMagneticModule,
      handleClick: jest.fn(),
      handleAboutClick: jest.fn(),
    }
    mockHeaterShakerWizard.mockReturnValue(<div>Mock Heater Shaker Wizard</div>)
    mocUseLiveCommandMutation.mockReturnValue({
      createCommand: mockCreateCommand,
    } as any)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders the correct magnetic module menu', () => {
    const { getByRole, getByText } = render(props)
    const buttonSetting = getByRole('button', { name: 'Set engage height' })
    expect(buttonSetting).toBeEnabled()
    expect(buttonSetting).toHaveStyle(`
      background-color: transparent;
    `)
    fireEvent.click(buttonSetting)
    expect(props.handleClick).toHaveBeenCalled()
    const buttonAbout = getByRole('button', { name: 'About module' })
    fireEvent.click(buttonAbout)
    expect(props.handleAboutClick).toHaveBeenCalled()
    expect(getByText('About module')).toHaveStyle('color: #16212D')
  })
  it('renders hover state color correctly', () => {
    const { getByRole } = render(props)
    const buttonSetting = getByRole('button', { name: 'Set engage height' })
    expect(buttonSetting).toHaveStyleRule(
      'background-color',
      COLORS.lightBlue,
      {
        modifier: ':hover',
      }
    )
  })
  it('renders the correct temperature module menu', () => {
    props = {
      module: mockTemperatureModuleGen2,
      handleClick: jest.fn(),
      handleAboutClick: jest.fn(),
    }
    const { getByRole } = render(props)
    const buttonSetting = getByRole('button', {
      name: 'Set module temperature',
    })
    fireEvent.click(buttonSetting)
    expect(props.handleClick).toHaveBeenCalled()
    const buttonAbout = getByRole('button', { name: 'About module' })
    fireEvent.click(buttonAbout)
    expect(props.handleAboutClick).toHaveBeenCalled()
  })
  it('renders the correct TC module menu', () => {
    props = {
      module: mockThermocycler,
      handleClick: jest.fn(),
      handleAboutClick: jest.fn(),
    }
    const { getByRole } = render(props)
    const buttonSettingLid = getByRole('button', {
      name: 'Set lid temperature',
    })
    fireEvent.click(buttonSettingLid)
    expect(props.handleClick).toHaveBeenCalled()
    const buttonAbout = getByRole('button', { name: 'About module' })
    fireEvent.click(buttonAbout)
    expect(props.handleAboutClick).toHaveBeenCalled()
    const buttonSettingBlock = getByRole('button', {
      name: 'Set block temperature',
    })
    fireEvent.click(buttonSettingBlock)
    expect(props.handleClick).toHaveBeenCalled()
  })
  it('renders the correct Heater Shaker module menu', () => {
    props = {
      module: mockHeaterShaker,
      handleClick: jest.fn(),
      handleAboutClick: jest.fn(),
    }
    // TODO(sh, 2022-03-08): extend tests when menu component is wired up
    const { getByRole } = render(props)
    getByRole('button', {
      name: 'Set module temperature',
    })
    getByRole('button', {
      name: 'Set shake speed',
    })
    getByRole('button', {
      name: 'Open Labware Latch',
    })
    getByRole('button', { name: 'About module' })
    getByRole('button', { name: 'See how to attach to deck' })
    getByRole('button', { name: 'Test shake' })
  })
  it('renders heater shaker see how to attach to deck button and when clicked, launches hs wizard', () => {
    props = {
      module: mockHeaterShaker,
      handleClick: jest.fn(),
      handleAboutClick: jest.fn(),
    }
    const { getByRole, getByText } = render(props)
    const btn = getByRole('button', { name: 'See how to attach to deck' })
    fireEvent.click(btn)
    getByText('Mock Heater Shaker Wizard')
  })

  it('renders heater shaker labware latch button and is disabled when status is not idle', () => {
    props = {
      module: mockMovingHeaterShaker,
      handleClick: jest.fn(),
      handleAboutClick: jest.fn(),
    }
    const { getByRole } = render(props)
    expect(
      getByRole('button', {
        name: 'Open Labware Latch',
      })
    ).toBeDisabled()
  })

  it('renders heater shaker shake button and is disabled when latch is opened', () => {
    props = {
      module: mockOpenLatchHeaterShaker,
      handleClick: jest.fn(),
      handleAboutClick: jest.fn(),
    }
    const { getByRole } = render(props)
    expect(
      getByRole('button', {
        name: 'Set shake speed',
      })
    ).toBeDisabled()
  })

  it('renders heater shaker labware latch button and when clicked, moves labware latch', () => {
    props = {
      module: mockHeaterShaker,
      handleClick: jest.fn(),
      handleAboutClick: jest.fn(),
    }

    const { getByRole } = render(props)

    const btn = getByRole('button', {
      name: 'Open Labware Latch',
    })
    expect(btn).not.toBeDisabled()

    // TODO(jr, 3/15/22): finish test when command is fully wired up
    // getByText('Close Labware Latch')
  })
})
