import * as React from 'react'
import { i18n } from '../../../../i18n'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { TemperatureModuleSlideout } from '../TemperatureModuleSlideout'
import {
  mockTemperatureModule,
  mockTemperatureModuleGen2,
} from '../../../../redux/modules/__fixtures__'

jest.mock('@opentrons/react-api-client')

const mockUseLiveCommandMutation = useCreateLiveCommandMutation as jest.MockedFunction<
  typeof useCreateLiveCommandMutation
>

const render = (
  props: React.ComponentProps<typeof TemperatureModuleSlideout>
) => {
  return renderWithProviders(<TemperatureModuleSlideout {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('TemperatureModuleSlideout', () => {
  let props: React.ComponentProps<typeof TemperatureModuleSlideout>
  let mockCreateLiveCommand = jest.fn()

  beforeEach(() => {
    mockCreateLiveCommand = jest.fn()
    props = {
      module: mockTemperatureModule,
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

  it('renders correct title and body for a gen1 temperature module', () => {
    const { getByText } = render(props)

    getByText('Set Temperature for Temperature Module GEN1')
    getByText(
      'Pre heat or cool your Temperature Module GEN1. Enter a whole number between 4 °C and 96 °C.'
    )
    getByText('Temperature')
  })

  it('renders correct title and body for a gen2 temperature module', () => {
    props = {
      module: mockTemperatureModuleGen2,
      isExpanded: true,
      onCloseClick: jest.fn(),
    }
    const { getByText } = render(props)

    getByText('Set Temperature for Temperature Module GEN2')
    getByText(
      'Pre heat or cool your Temperature Module GEN2. Enter a whole number between 4 °C and 96 °C.'
    )
    getByText('Temperature')
  })

  it('renders the button and it is not clickable until there is something in form field', () => {
    const { getByRole, getByTestId } = render(props)
    const button = getByRole('button', { name: 'Set Temperature' })
    const input = getByTestId('temperatureModuleV1')
    fireEvent.change(input, { target: { value: '20' } })
    expect(button).toBeEnabled()
    fireEvent.click(button)

    expect(mockCreateLiveCommand).toHaveBeenCalledWith({
      command: {
        commandType: 'temperatureModule/setTargetTemperature',
        params: {
          moduleId: mockTemperatureModule.id,
          temperature: 20,
        },
      },
    })
    expect(button).not.toBeEnabled()
  })
})
