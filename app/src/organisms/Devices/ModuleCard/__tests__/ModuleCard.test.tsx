import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { MagneticModuleData } from '../MagneticModuleData'
import { ModuleCard } from '..'
import { mockMagneticModule } from '../../../../redux/modules/__fixtures__'

jest.mock('../MagneticModuleData')

const mockMagneticModuleData = MagneticModuleData as jest.MockedFunction<
  typeof MagneticModuleData
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

  it('renders information for a magnetic module with mocked status', () => {
    const { getByText, getByAltText } = render(props)
    getByText('Magnetic Module GEN1')
    getByText('Mock Magnetic Module Data')
    getByText('usb port 1')
    getByAltText('magneticModuleV1')
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
