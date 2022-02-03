import * as React from 'react'
import { resetAllWhenMocks } from 'jest-when'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { MagneticModuleData } from '../MagneticModuleData'
import { TemperatureModuleData } from '../TemperatureModuleData'
import { ModuleCard } from '..'
import {
  mockMagneticModule,
  mockTemperatureModuleGen2,
} from '../../../../redux/modules/__fixtures__'

jest.mock('../MagneticModuleData')
jest.mock('../TemperatureModuleData')

const mockMagneticModuleData = MagneticModuleData as jest.MockedFunction<
  typeof MagneticModuleData
>
const mockTemperatureModuleData = TemperatureModuleData as jest.MockedFunction<
  typeof TemperatureModuleData
>

const render = (props: React.ComponentProps<typeof ModuleCard>) => {
  return renderWithProviders(<ModuleCard {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ModuleCard', () => {
  let props: React.ComponentProps<typeof ModuleCard>

  beforeEach(() => {
    props = {
      module: mockMagneticModule,
    }
    mockMagneticModuleData.mockReturnValue(<div>Mock Magnetic Module Data</div>)
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('renders information for a magnetic module with mocked status', () => {
    const { getByText, getByAltText } = render(props)
    getByText('Magnetic Module GEN1')
    getByText('Mock Magnetic Module Data')
    getByText('usb port 1')
    getByAltText('magneticModuleV1')
  })
  it('renders information for a temperature module with mocked status', () => {
    props = {
      module: mockTemperatureModuleGen2,
    }
    mockTemperatureModuleData.mockReturnValue(
      <div>Mock Temperature Module Data</div>
    )

    const { getByText, getByAltText } = render(props)
    getByText('Temperature Module GEN2')
    getByText('Mock Temperature Module Data')
    getByText('usb port 1')
    getByAltText('temperatureModuleV2')
  })

  //  TODO Immediately: add more details to this test when overflow button has more functionality
  it('renders 3 dot button icon and is clickable', () => {
    const { getByRole, getByText } = render(props)
    const overflowButton = getByRole('button', {
      name: /overflow/i,
    })
    getByText('Magnetic Module GEN1')
    fireEvent.click(overflowButton)
    expect(overflowButton).not.toBeDisabled()
  })
})
