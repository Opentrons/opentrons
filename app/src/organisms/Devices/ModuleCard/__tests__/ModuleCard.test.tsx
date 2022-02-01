import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { StatusLabel } from '../StatusLabel'
import { ModuleCard } from '..'
import { mockMagneticModule } from '../../../../redux/modules/__fixtures__'

jest.mock('../StatusLabel')

const mockStatusLabel = StatusLabel as jest.MockedFunction<typeof StatusLabel>

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
    mockStatusLabel.mockReturnValue(<div>Mock Status Label</div>)
  })

  it('renders information for a magnetic module with mocked status', () => {
    const { getByText, getByAltText } = render(props)
    getByText('Magnetic Module GEN1')
    getByText('Mock Status Label')
    getByText('usb port 1')
    getByAltText('magneticModuleV1')
  })

  //  TODO Immediately: fix this when we add more details to the overflow button
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
