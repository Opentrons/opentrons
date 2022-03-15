import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'
import { MagneticModuleSlideout } from '../MagneticModuleSlideout'

import {
  mockMagneticModule,
  mockMagneticModuleGen2,
} from '../../../../redux/modules/__fixtures__'

jest.mock('@opentrons/react-api-client')

const mockUseLiveCommandMutation = useCreateLiveCommandMutation as jest.MockedFunction<
  typeof useCreateLiveCommandMutation
>

const render = (props: React.ComponentProps<typeof MagneticModuleSlideout>) => {
  return renderWithProviders(<MagneticModuleSlideout {...props} />, {
    i18nInstance: i18n,
  })[0]
}
describe('MagneticModuleSlideout', () => {
  let props: React.ComponentProps<typeof MagneticModuleSlideout>
  let mockCreateLiveCommand = jest.fn()
  beforeEach(() => {
    mockCreateLiveCommand = jest.fn()
    props = {
      module: mockMagneticModule,
      isExpanded: true,
      onCloseClick: jest.fn(),
    }
    mockUseLiveCommandMutation.mockReturnValue({
      createLiveCommand: mockCreateLiveCommand,
    } as any)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct title and body for a gen1 magnetic module', () => {
    const { getByText } = render(props)

    getByText('Set Engage Height for Magnetic Module GEN1')
    getByText(
      'Set the engage height for this Magnetic Module. Enter an integer between -5 and 40.'
    )
    getByText('GEN 1 Height Ranges')
    getByText('Max Engage Height')
    getByText('Labware Bottom')
    getByText('Disengaged')
    getByText('40')
    getByText('0')
    getByText('-5')
    getByText('Engage height')
    getByText('Set Engage Height')
  })

  it('renders correct title and body for a gen2 magnetic module', () => {
    props = {
      module: mockMagneticModuleGen2,
      isExpanded: true,
      onCloseClick: jest.fn(),
    }
    const { getByText } = render(props)

    getByText('Set Engage Height for Magnetic Module GEN2')
    getByText(
      'Set the engage height for this Magnetic Module. Enter an integer between -4 and 16.'
    )
    getByText('GEN 2 Height Ranges')
    getByText('Max Engage Height')
    getByText('Labware Bottom')
    getByText('Disengaged')
    getByText('16 mm')
    getByText('0 mm')
    getByText('-4 mm')
    getByText('Engage height')
    getByText('Set Engage Height')
  })

  it('renders the button and it is not clickable until there is something in form field', () => {
    const { getByRole, getByTestId } = render(props)
    const button = getByRole('button', { name: 'Set Engage Height' })
    const input = getByTestId('magneticModuleV1')
    fireEvent.change(input, { target: { value: '10' } })
    expect(button).toBeEnabled()
    fireEvent.click(button)
    expect(mockCreateLiveCommand).toHaveBeenCalledWith({
      command: {
        commandType: 'magneticModule/engageMagnet',
        params: {
          moduleId: 'magdeck_id',
          engageHeight: 10,
        },
      },
    })
    expect(button).not.toBeEnabled()
  })
})
