import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { MagneticModuleData } from '../MagneticModuleData'
import { ThermocyclerModuleData } from '../ThermocyclerModuleData'
import { ModuleCard } from '..'
import {
  mockMagneticModule,
  mockThermocycler,
} from '../../../../redux/modules/__fixtures__'

jest.mock('../MagneticModuleData')
jest.mock('../ThermocyclerModuleData')

const mockMagneticModuleData = MagneticModuleData as jest.MockedFunction<
  typeof MagneticModuleData
>
const mockThermocyclerModuleData = ThermocyclerModuleData as jest.MockedFunction<
  typeof ThermocyclerModuleData
>

const render = (props: React.ComponentProps<typeof ModuleCard>) => {
  return renderWithProviders(<ModuleCard {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ModuleCard', () => {
  beforeEach(() => {
    mockMagneticModuleData.mockReturnValue(<div>Mock Magnetic Module Data</div>)
    mockThermocyclerModuleData.mockReturnValue(
      <div>Mock Thermocycler Module Data</div>
    )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders information for a magnetic module with mocked status', () => {
    const { getByText, getByAltText } = render({
      module: mockMagneticModule,
    })

    getByText('Magnetic Module GEN1')
    getByText('Mock Magnetic Module Data')
    getByText('usb port 1')
    getByAltText('magneticModuleV1')
  })

  it('renders information for a thermocycler module with mocked status', () => {
    const { getByText, getByAltText } = render({
      module: mockThermocycler,
    })

    getByText('Thermocycler Module')
    getByText('Mock Thermocycler Module Data')
    getByText('usb port 1')
    getByAltText('thermocyclerModuleV1')
  })

  //  TODO Immediately: add more details to this test when overflow button has more functionality
  it('renders 3 dot button icon and is clickable', () => {
    const { getByRole, getByText } = render({
      module: mockMagneticModule,
    })

    const overflowButton = getByRole('button', {
      name: /overflow/i,
    })
    getByText('Magnetic Module GEN1')
    fireEvent.click(overflowButton)
    expect(overflowButton).not.toBeDisabled()
  })
})
