import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { InputField } from '@opentrons/components/src/forms/InputField'
import { i18n } from '../../../../i18n'
import { useSendModuleCommand } from '../../../../redux/modules'
import { ThermocyclerModuleSlideout } from '../ThermocyclerModuleSlideout'

import { mockThermocycler } from '../../../../redux/modules/__fixtures__'

jest.mock('../../../../redux/modules')
jest.mock('@opentrons/components/src/forms/InputField')

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
    }
    const { getByText } = render(props)

    getByText('Set Block Temperature for Thermocycler Module')
    getByText(
      'Pre heat or cool your Thermocycler Block. Enter a whole number between 4 °C and 99 °C.'
    )
    getByText('Temperature')
    getByText('Set Block Temperature')
  })

  it('renders the button and it is not clickable until there is something in form field', () => {
    props = {
      module: mockThermocycler,
      isSecondaryTemp: false,
      isExpanded: true,
    }
    const { getByRole } = render(props)
    const button = getByRole('button', { name: 'Set Block Temperature' })
    expect(button).not.toBeEnabled()
  })
})
