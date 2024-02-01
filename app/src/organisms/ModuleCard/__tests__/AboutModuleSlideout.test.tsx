import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { fireEvent } from '@testing-library/react'
import {
  RUN_STATUS_IDLE,
  RUN_STATUS_RUNNING,
  RUN_STATUS_FINISHING,
} from '@opentrons/api-client'
import { i18n } from '../../../i18n'
import { useCurrentRunStatus } from '../../RunTimeControl/hooks'
import {
  mockMagneticModule,
  mockMagneticModuleGen2,
  mockTemperatureModule,
  mockTemperatureModuleGen2,
  mockThermocycler,
} from '../../../redux/modules/__fixtures__'
import { AboutModuleSlideout } from '../AboutModuleSlideout'

jest.mock('../../RunTimeControl/hooks')

const mockUseCurrentRunStatus = useCurrentRunStatus as jest.MockedFunction<
  typeof useCurrentRunStatus
>

const render = (props: React.ComponentProps<typeof AboutModuleSlideout>) => {
  return renderWithProviders(<AboutModuleSlideout {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('AboutModuleSlideout', () => {
  let props: React.ComponentProps<typeof AboutModuleSlideout>
  beforeEach(() => {
    props = {
      module: mockMagneticModule,
      isExpanded: true,
      onCloseClick: jest.fn(),
      firmwareUpdateClick: jest.fn(),
    }
    mockUseCurrentRunStatus.mockReturnValue(RUN_STATUS_IDLE)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct info when module is a magnetic module  GEN1 and exit button works correctly', () => {
    const { getByText, getByRole } = render(props)

    getByText('About Magnetic Module GEN1')
    getByText('def456')
    getByText('SERIAL NUMBER')
    getByText('CURRENT VERSION')
    getByText('v2.0.0')
    const button = getByRole('button', { name: /exit/i })
    fireEvent.click(button)
    expect(props.onCloseClick).toHaveBeenCalled()
  })

  it('renders no banner when run is running', () => {
    mockUseCurrentRunStatus.mockReturnValue(RUN_STATUS_RUNNING)
    const { getByText } = render(props)

    getByText('About Magnetic Module GEN1')
    getByText('def456')
    getByText('SERIAL NUMBER')
    getByText('CURRENT VERSION')
    getByText('v2.0.0')
  })

  it('renders no banner when run is finishing', () => {
    mockUseCurrentRunStatus.mockReturnValue(RUN_STATUS_FINISHING)
    const { getByText } = render(props)

    getByText('About Magnetic Module GEN1')
    getByText('def456')
    getByText('SERIAL NUMBER')
    getByText('CURRENT VERSION')
    getByText('v2.0.0')
  })

  it('renders correct info when module is a magnetic module GEN2', () => {
    props = {
      module: mockMagneticModuleGen2,
      isExpanded: true,
      onCloseClick: jest.fn(),
      firmwareUpdateClick: jest.fn(),
    }
    const { getByText } = render(props)

    getByText('About Magnetic Module GEN2')
    getByText('def456')
    getByText('SERIAL NUMBER')
    getByText('CURRENT VERSION')
    getByText('v2.0.0')
  })

  it('renders correct info when module is a temperature module GEN2', () => {
    props = {
      module: mockTemperatureModuleGen2,
      isExpanded: true,
      onCloseClick: jest.fn(),
      firmwareUpdateClick: jest.fn(),
    }
    const { getByText } = render(props)

    getByText('About Temperature Module GEN2')
    getByText('abc123')
    getByText('SERIAL NUMBER')
    getByText('CURRENT VERSION')
    getByText('v2.0.0')
  })

  it('renders correct info when module is a temperature module GEN1', () => {
    props = {
      module: mockTemperatureModule,
      isExpanded: true,
      onCloseClick: jest.fn(),
      firmwareUpdateClick: jest.fn(),
    }
    const { getByText } = render(props)

    getByText('About Temperature Module GEN1')
    getByText('abc123')
    getByText('SERIAL NUMBER')
    getByText('CURRENT VERSION')
    getByText('v2.0.0')
  })

  it('renders correct info when module is a thermocycler module with an update available', () => {
    props = {
      module: mockThermocycler,
      isExpanded: true,
      onCloseClick: jest.fn(),
      firmwareUpdateClick: jest.fn(),
    }
    const { getByText, getByRole, getByLabelText } = render(props)

    getByText('About Thermocycler Module GEN1')
    getByText('ghi789')
    getByText('SERIAL NUMBER')
    getByText('CURRENT VERSION')
    getByText('v2.0.0')
    getByText('Firmware update available.')
    const viewUpdate = getByRole('button', { name: 'Update now' })
    fireEvent.click(viewUpdate)
    expect(props.firmwareUpdateClick).toHaveBeenCalled()
    expect(props.onCloseClick).toHaveBeenCalled()
    expect(viewUpdate).toBeEnabled()
    const exit = getByLabelText('close_icon')
    fireEvent.click(exit)
    expect(exit).not.toBeVisible()
  })

  it('renders correct info when module is a temperature module GEN1 and clicking on button closes it', () => {
    props = {
      module: mockTemperatureModule,
      isExpanded: true,
      onCloseClick: jest.fn(),
      firmwareUpdateClick: jest.fn(),
    }
    const { getByText, getByRole } = render(props)

    getByText('About Temperature Module GEN1')
    getByText('abc123')
    getByText('SERIAL NUMBER')
    getByText('CURRENT VERSION')
    getByText('v2.0.0')
    const button = getByRole('button', { name: 'close' })
    fireEvent.click(button)
    expect(props.onCloseClick).toHaveBeenCalled()
  })
})
