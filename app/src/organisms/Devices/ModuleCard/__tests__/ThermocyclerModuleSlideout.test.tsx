import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { fireEvent } from '@testing-library/react'
import { i18n } from '../../../../i18n'
import { useSendModuleCommand } from '../../../../redux/modules'
import { InputField } from '../../../../atoms/InputField'
import { ThermocyclerModuleSlideout } from '../ThermocyclerModuleSlideout'

import { mockThermocycler } from '../../../../redux/modules/__fixtures__'

jest.mock('../../../../redux/modules')
jest.mock('../../../../atoms/InputField')

const mockUseSendModuleCommand = useSendModuleCommand as jest.MockedFunction<
  typeof useSendModuleCommand
>
const mockInputField = InputField as jest.MockedFunction<typeof InputField>

const render = (
  props: React.ComponentProps<typeof ThermocyclerModuleSlideout>
) => {
  return renderWithProviders(<ThermocyclerModuleSlideout {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ThermocyclerModuleSlideout', () => {
  let props: React.ComponentProps<typeof ThermocyclerModuleSlideout>
  beforeEach(() => {
    mockInputField.mockReturnValue(<div></div>)
    mockUseSendModuleCommand.mockReturnValue(jest.fn())
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
    const { getByRole } = render(props)
    const button = getByRole('button', { name: 'Set Block Temperature' })
    expect(button).not.toBeEnabled()
    mockInputField.mockReturnValue(<div>12 C</div>)
    mockUseSendModuleCommand.mockReturnValue({
      moduleId: props.module.serial,
      command: 'set_temperature',
      args: 12,
    } as any)
    fireEvent.click(button)
    expect(button).not.toBeEnabled()
  })

  it('renders the button and it is not clickable until there is something in form field for the TC Lid', () => {
    props = {
      module: mockThermocycler,
      isSecondaryTemp: true,
      isExpanded: true,
      onCloseClick: jest.fn(),
    }
    const { getByRole } = render(props)
    const button = getByRole('button', { name: 'Set Lid Temperature' })
    expect(button).not.toBeEnabled()
    mockInputField.mockReturnValue(<div>40 C</div>)
    mockUseSendModuleCommand.mockReturnValue({
      moduleId: props.module.serial,
      command: 'set_lid_temperature',
      args: 40,
    } as any)
    fireEvent.click(button)
    expect(button).not.toBeEnabled()
  })
})
