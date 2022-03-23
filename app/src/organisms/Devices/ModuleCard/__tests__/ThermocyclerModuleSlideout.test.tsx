import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { fireEvent } from '@testing-library/react'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'
import { i18n } from '../../../../i18n'
import { ThermocyclerModuleSlideout } from '../ThermocyclerModuleSlideout'

import { mockThermocycler } from '../../../../redux/modules/__fixtures__'

jest.mock('@opentrons/react-api-client')

const mockUseLiveCommandMutation = useCreateLiveCommandMutation as jest.MockedFunction<
  typeof useCreateLiveCommandMutation
>

const render = (
  props: React.ComponentProps<typeof ThermocyclerModuleSlideout>
) => {
  return renderWithProviders(<ThermocyclerModuleSlideout {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ThermocyclerModuleSlideout', () => {
  let props: React.ComponentProps<typeof ThermocyclerModuleSlideout>
  let mockCreateLiveCommand = jest.fn()
  beforeEach(() => {
    mockCreateLiveCommand = jest.fn()
    mockCreateLiveCommand.mockResolvedValue(null)
    mockUseLiveCommandMutation.mockReturnValue({
      createLiveCommand: mockCreateLiveCommand,
    } as any)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct title and body for Thermocycler Lid temperature', () => {
    props = {
      module: mockThermocycler,
      isSecondaryTemp: true,
      isExpanded: true,
      onCloseClick: jest.fn(),
    }
    const { getByText } = render(props)

    getByText('Set Lid Temperature for Thermocycler Module')
    getByText(
      'Pre heat or cool your Thermocycler Lid. Enter a whole number between 37 °C and 110 °C.'
    )
    getByText('Temperature')
    getByText('Set Lid Temperature')
  })

  it('renders correct title and body for Thermocycler Block Temperature', () => {
    props = {
      module: mockThermocycler,
      isSecondaryTemp: false,
      isExpanded: true,
      onCloseClick: jest.fn(),
    }
    const { getByText } = render(props)

    getByText('Set Block Temperature for Thermocycler Module')
    getByText(
      'Pre heat or cool your Thermocycler Block. Enter a whole number between 4 °C and 99 °C.'
    )
    getByText('Temperature')
    getByText('Set Block Temperature')
  })

  it('renders the button and it is not clickable until there is something in form field for the TC Block', () => {
    props = {
      module: mockThermocycler,
      isSecondaryTemp: false,
      isExpanded: true,
      onCloseClick: jest.fn(),
    }
    const { getByRole, getByTestId } = render(props)
    const button = getByRole('button', { name: 'Set Block Temperature' })
    const input = getByTestId('thermocyclerModuleV1_false')
    fireEvent.change(input, { target: { value: '45' } })
    expect(button).toBeEnabled()
    fireEvent.click(button)

    expect(mockCreateLiveCommand).toHaveBeenCalledWith({
      command: {
        commandType: 'thermocycler/setTargetBlockTemperature',
        params: {
          moduleId: mockThermocycler.id,
          temperature: 45,
        },
      },
    })
    expect(button).not.toBeEnabled()
  })

  it('renders the button and it is not clickable until there is something in form field for the TC Lid', () => {
    props = {
      module: mockThermocycler,
      isSecondaryTemp: true,
      isExpanded: true,
      onCloseClick: jest.fn(),
    }
    const { getByRole, getByTestId } = render(props)
    const button = getByRole('button', { name: 'Set Lid Temperature' })
    const input = getByTestId('thermocyclerModuleV1_true')
    fireEvent.change(input, { target: { value: '45' } })
    expect(button).toBeEnabled()
    fireEvent.click(button)

    expect(mockCreateLiveCommand).toHaveBeenCalledWith({
      command: {
        commandType: 'thermocycler/setTargetLidTemperature',
        params: {
          moduleId: mockThermocycler.id,
          temperature: 45,
        },
      },
    })
    expect(button).not.toBeEnabled()
  })
})
